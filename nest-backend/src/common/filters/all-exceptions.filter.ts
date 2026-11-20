import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

/**
 * Preserves the Express backend's uniform error envelope: { "message": "..." }.
 * NestJS normally emits { message: string[], error, statusCode }, so unwrap it.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error.";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else if (body && typeof body === "object") {
        const candidate = (body as { message?: unknown }).message;
        if (typeof candidate === "string") {
          message = candidate;
        } else if (Array.isArray(candidate) && candidate.length > 0) {
          message = String(candidate[0]);
        }
      }
    }

    response.status(status).json({ message });
  }
}
