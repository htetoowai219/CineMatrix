import {
  HttpException,
  InternalServerErrorException,
} from "@nestjs/common";

/**
 * Mirrors the Express controllers' `catch` blocks: expected HttpExceptions pass
 * through unchanged, everything else is logged and returns the same 500 copy.
 */
export function handleError(
  error: unknown,
  logLabel: string,
  message: string,
): never {
  if (error instanceof HttpException) throw error;
  console.error(logLabel, error);
  throw new InternalServerErrorException(message);
}
