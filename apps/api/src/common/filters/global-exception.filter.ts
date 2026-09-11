import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any = isHttpException
      ? exception.getResponse()
      : 'Internal server error';

    // Extract error message string if response is an object
    if (typeof message === 'object' && message !== null && 'message' in message) {
      message = message.message;
    }

    // Log full error server-side
    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} Error on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`HTTP ${status} Warning on ${request.method} ${request.url}: ${JSON.stringify(message)}`);
    }

    // In production, mask 500 errors to prevent leaking internal stack traces or database info
    const isProduction = process.env.NODE_ENV === 'production';
    const responseMessage =
      isProduction && status === HttpStatus.INTERNAL_SERVER_ERROR
        ? 'An unexpected error occurred. Please try again later.'
        : message;

    response.status(status).json({
      statusCode: status,
      message: responseMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
