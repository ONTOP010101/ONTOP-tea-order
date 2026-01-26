import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    // 开发环境下输出详细错误信息
    const errorDetails = process.env.NODE_ENV === 'production' ? null : {
      stack: exception instanceof Error ? exception.stack : null,
      exception: exception instanceof Error ? exception.name : typeof exception,
    };

    response.status(status).json({
      code: status,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...errorDetails,
    });
  }
}
