import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';
import { OrderModule } from './modules/order/order.module';
import { BannerModule } from './modules/banner/banner.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { UploadModule } from './modules/upload/upload.module';
import { TranslationModule } from './translation/translation.module';
import { SpecModule } from './modules/spec/spec.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 数据库模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // 临时启用自动同步，用于更新数据库模式
        logging: false,
        timezone: '+08:00',
      }),
      inject: [ConfigService],
    }),

    // 业务模块
    AuthModule,
    UserModule,
    ProductModule,
    CategoryModule,
    OrderModule,
    BannerModule,
    WebsocketModule,
    UploadModule,
    TranslationModule,
    SpecModule,
  ],
})
export class AppModule {}
