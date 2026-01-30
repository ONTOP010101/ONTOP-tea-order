import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'], // 只输出错误、警告和日志信息，不输出调试信息
  });
  const configService = app.get(ConfigService);

  // 全局前缀
  app.setGlobalPrefix('api');

  // 静态文件服务 - 用于访问上传的图片
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res, path) => {
      if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.gif')) {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24小时缓存
      }
    }
  });

  // 跨域配置 - 支持多个来源
  const corsOrigins = configService.get('CORS_ORIGIN') || '*';
  app.enableCors({
    origin: (origin, callback) => {
      // 如果配置为*，允许所有来源
      if (corsOrigins === '*') {
        callback(null, true);
        return;
      }
      
      // 解析多个来源（逗号分隔）
      const allowedOrigins = corsOrigins.split(',').map((o: string) => o.trim());
      
      // 允许无 origin 的请求（如 Postman、curl）
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // 检查来源是否在允许列表中
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 全局过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = configService.get('PORT') || 3001;
  // 监听所有IP地址，确保其他电脑可以访问
  await app.listen(port, '0.0.0.0');
  console.log(`服务器运行在: http://0.0.0.0:${port}`);
  console.log(`API文档: http://0.0.0.0:${port}/api`);
  console.log(`上传文件访问: http://0.0.0.0:${port}/uploads/`);
}

bootstrap();
