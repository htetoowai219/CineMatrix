import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import multer from "multer";
import type { RequestHandler } from "express";
import { defer, switchMap, type Observable } from "rxjs";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

// In-memory storage: buffers are handed to Cloudinary right away, so nothing
// is ever written to the local filesystem.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(null, true);
    }
    return cb(
      new Error("Only image files (JPEG, PNG, WEBP, GIF, AVIF) are allowed."),
    );
  },
  limits: { fileSize: MAX_IMAGE_SIZE },
});

/**
 * Runs the original multer middleware inside Nest's interceptor pipeline so
 * field names, maxCount, MIME filtering, limits and error copy stay identical
 * to the Express implementation.
 */
@Injectable()
export class MulterMiddlewareInterceptor implements NestInterceptor {
  constructor(private readonly middleware: RequestHandler) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return defer(
      () =>
        new Promise<void>((resolve, reject) => {
          this.middleware(request, response, (error?: unknown) => {
            if (error) {
              const message =
                error instanceof Error ? error.message : String(error);
              reject(new BadRequestException(message));
              return;
            }
            resolve();
          });
        }),
    ).pipe(switchMap(() => next.handle()));
  }
}

export const multerSingle = (field: string): MulterMiddlewareInterceptor =>
  new MulterMiddlewareInterceptor(upload.single(field));

export const multerFields = (
  fields: { name: string; maxCount: number }[],
): MulterMiddlewareInterceptor =>
  new MulterMiddlewareInterceptor(upload.fields(fields));

export const uploadMovieImagesInterceptor = multerFields([
  { name: "posterImage", maxCount: 1 },
  { name: "backdropImage", maxCount: 1 },
]);

export const uploadCinemaImagesInterceptor = multerFields([
  { name: "images", maxCount: 10 },
  { name: "gallery", maxCount: 10 },
]);
