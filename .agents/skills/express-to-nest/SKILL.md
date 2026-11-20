---
name: express-to-nest
description: >-
  Migrate an Express.js TypeScript backend to a modular NestJS application with 100%
  API contract fidelity, matching Mongoose schemas, Cloudinary/Multer handling,
  JWT cookies, and security configurations.
license: MIT
compatibility: Designed for Agent Skills-compatible tools (Claude Code, Cursor, Codex, Gemini CLI, OpenCode)
metadata:
  source: custom
---

# Express to NestJS Migration Guide

This skill provides an actionable blueprint for translating an Express.js TypeScript backend into a modular NestJS application with 100% contract, schema, and behavioral fidelity so that existing frontend clients and databases continue working seamlessly.

---

## 1. Architectural Translation Matrix

| Express Component | NestJS Equivalent | Implementation Notes |
| :--- | :--- | :--- |
| `src/db/index.ts` | `MongooseModule.forRootAsync` | Configured in `app.module.ts` via `ConfigService` reading `MONGO_URI`. |
| `src/model/*.model.ts` | `src/modules/<feature>/schemas/*.schema.ts` | Uses `@Schema({ timestamps: true })` and explicit `@Prop({ type: ... })`. |
| `src/controllers/*.controller.ts` | `*.service.ts` & `*.controller.ts` | Service handles DB queries & business logic; Controller defines HTTP endpoints, decorators, and status codes. |
| `src/routes/*.route.ts` | `*.controller.ts` | Maps to route decorators (`@Get`, `@Post`, `@Put`, `@Delete`) under `@Controller('<feature>')`. |
| `src/middleware/auth.middleware.ts` (`protect`) | `src/common/guards/jwt-auth.guard.ts` | Implements `CanActivate`; extracts JWT from `req.cookies.token` or `req.headers.authorization`. |
| `src/middleware/auth.middleware.ts` (`adminOnly`)| `src/common/guards/roles.guard.ts` | Implements `CanActivate`; checks `req.user.role === 'admin'`. |
| `src/util/multer.ts` | `src/common/utils/multer.config.ts` | `MulterOptions` with memory storage and MIME type validation. Used with `FilesInterceptor`. |
| `src/util/cloudinary.ts` | `src/modules/cloudinary/cloudinary.service.ts` | Injectable service wrapping Cloudinary upload stream and destroy methods. |
| `express-rate-limit` | `@nestjs/throttler` | `@Throttle({ default: { limit: 20, ttl: 900000 } })` + `@UseGuards(ThrottlerGuard)`. |
| `cookieParser()` + `res.cookie()` | `app.use(cookieParser())` + `@Res({ passthrough: true })` | Preserves HTTP-only cookie attributes (`sameSite`, `secure`, `maxAge`). |
| `src/seed.ts` | `src/seed.ts` via `npm run seed` | Standalone seeder run via `tsx` using direct Mongoose models, bypassing full DI container bootup. |

---

## 2. Project Scaffolding & Dependencies

### Step 1: Scaffold NestJS (CommonJS recommended for CJS module compatibility)
```bash
printf "\x1b[B\n" | nest new nest-server --package-manager npm --skip-git --no-observe
cd nest-server
```

### Step 2: Install Required Dependencies
```bash
npm install @nestjs/mongoose mongoose @nestjs/config @nestjs/throttler \
  jsonwebtoken @types/jsonwebtoken bcryptjs @types/bcryptjs \
  cookie-parser @types/cookie-parser helmet cloudinary google-auth-library \
  multer @types/multer class-validator class-transformer
npm install -D tsx
```

### Step 3: Add Seed Script to `package.json`
```json
"scripts": {
  "build": "nest build",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "seed": "tsx src/seed.ts"
}
```

---

## 3. Directory Structure

```
nest-server/src/
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts      # @CurrentUser() param decorator
│   │   └── roles.decorator.ts             # @Roles('admin') metadata decorator
│   ├── filters/
│   │   └── all-exceptions.filter.ts       # Uniform { message } error envelope
│   ├── guards/
│   │   ├── jwt-auth.guard.ts              # Cookie / Bearer token guard
│   │   └── roles.guard.ts                 # Role-based authorization guard
│   └── utils/
│       └── multer.config.ts               # Multer memory storage & MIME filter
├── modules/
│   ├── auth/                              # Authentication module
│   │   ├── dto/
│   │   ├── schemas/user.schema.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── items/                             # Items module with file uploads
│   ├── discounts/                         # Discounts module
│   ├── announcements/                     # Announcements module
│   ├── settings/                          # Store settings & hero images
│   ├── health/                            # /health and /api/health
│   └── cloudinary/                        # Reusable Cloudinary service
├── app.module.ts
├── main.ts
└── seed.ts
```

---

## 4. Key Implementation Patterns

### A. Mongoose Schema Definition
> [!IMPORTANT]
> Always define explicit `type` inside `@Prop({ type: ... })` when `isolatedModules` or `tsx` is used, otherwise NestJS may throw `CannotDetermineTypeError`.

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ItemDocument = Item & Document;

@Schema({ timestamps: true })
export class Item {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;

  @Prop({ type: String, required: true, lowercase: true, trim: true })
  category!: string;

  @Prop({ type: [{ url: String, publicId: String }], default: [] })
  images!: { url: string; publicId: string }[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Discount' })
  discount?: Types.ObjectId;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
ItemSchema.index({ name: 'text', description: 'text' });
```

---

### B. JWT Authentication & Cookie Handling
Extract token from either cookie or Authorization header:

```typescript
// src/common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let token = request.cookies?.token;

    if (!token && request.headers.authorization?.startsWith('Bearer ')) {
      token = request.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedException('Not authorized, no token provided');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as { id: string; role: string };
      const user = await this.userModel.findById(decoded.id);
      if (!user) {
        throw new UnauthorizedException('Not authorized, user not found');
      }
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Not authorized, token invalid or expired');
    }
  }
}
```

Set cookies in Controller using `@Res({ passthrough: true })`:
> [!NOTE]
> Use `import type { Response } from 'express'` to prevent TypeScript error `TS1272: A type referenced in a decorated signature must be imported with 'import type'`.

```typescript
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 900000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.login(dto, res);
  }
}
```

In `AuthService`:
```typescript
setTokenCookie(res: Response, token: string): void {
  const isProd = this.configService.get('NODE_ENV') === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
```

---

### C. Multer Configuration & Cloudinary File Uploads
```typescript
// src/common/utils/multer.config.ts
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as multer from 'multer';

export const multerImageOptions: MulterOptions = {
  storage: multer.memoryStorage(),
  fileFilter: (_req: any, file: any, cb: (error: any, acceptFile: boolean) => void) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Invalid file type'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
};
```

In Controller:
```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(FilesInterceptor('images', 5, multerImageOptions))
@HttpCode(HttpStatus.CREATED)
async create(
  @Body() dto: CreateItemDto,
  @UploadedFiles() files?: Express.Multer.File[]
) {
  return this.itemsService.create(dto, files);
}
```

---

### D. Standalone Database Seeder Pattern (`src/seed.ts`)
Run seeding directly with `tsx src/seed.ts` without loading the entire NestJS DI container:

```typescript
import * as dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UserSchema } from './modules/auth/schemas/user.schema';

const User = mongoose.model('User', UserSchema);

async function runSeed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/app';
  await mongoose.connect(mongoUri);

  await User.deleteMany({});
  const salt = await bcrypt.genSalt(10);
  await User.create({
    name: 'Admin',
    email: 'admin@example.com',
    password: await bcrypt.hash('admin123456', salt),
    role: 'admin',
  });

  console.log('Seeding complete!');
  await mongoose.disconnect();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

---

### E. Bootstrap Configuration (`main.ts`)
Ensures reverse proxy trust, CORS policies, Helmet headers, cookie parsing, and prefix exclusion:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  expressApp.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((u) => u.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (clientUrls.includes(cleanOrigin) || cleanOrigin === 'http://localhost:5173') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS policy'));
    },
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Set global prefix excluding health checks
  app.setGlobalPrefix('api', {
    exclude: ['health', 'api/health'],
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}
bootstrap();
```

---

## 5. Troubleshooting & Critical Pitfalls

1. **`CannotDetermineTypeError` during schema compilation**:
   - Cause: Missing explicit `type` in `@Prop()` with TypeScript `isolatedModules` or `tsx`.
   - Solution: Explicitly specify `@Prop({ type: String, ... })` or `@Prop({ type: Number, ... })`.

2. **`TS1272: A type referenced in a decorated signature must be imported with 'import type'`**:
   - Cause: Non-value types (e.g. `Response` from `express`, Mongoose document interfaces) used as parameter types in decorated methods.
   - Solution: Change import to `import type { Response } from 'express'`.

3. **Global Prefix breaks `/health` endpoint**:
   - Solution: Pass `exclude: ['health', 'api/health']` to `app.setGlobalPrefix('api')` and handle `@Get(['health', 'api/health'])` in `HealthController`.

4. **Missing Body on `DELETE` Requests**:
   - Some frontend libraries (like Axios) send data in `{ data: { publicId } }` on `DELETE` requests.
   - Solution: Support parameter, query, and body in controller:
     ```typescript
     @Delete('hero-images')
     async deleteHeroImage(
       @Body('publicId') bodyId?: string,
       @Query('publicId') queryId?: string
     ) {
       return this.settingsService.deleteHeroImage(bodyId || queryId);
     }
     ```
