import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../entities/product.entity';
import { TimeLimitedProduct } from '../../entities/time-limited-product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TimeLimitedProductController } from './time-limited-product.controller';
import { TimeLimitedProductService } from './time-limited-product.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, TimeLimitedProduct])],
  controllers: [ProductController, TimeLimitedProductController],
  providers: [ProductService, TimeLimitedProductService],
  exports: [ProductService, TimeLimitedProductService]
})
export class ProductModule {}
