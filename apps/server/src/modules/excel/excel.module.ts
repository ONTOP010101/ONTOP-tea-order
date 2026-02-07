import { Module } from '@nestjs/common';
import { ExcelController } from './excel.controller';
import { ProductModule } from '../product/product.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [ProductModule, CategoryModule],
  controllers: [ExcelController],
})
export class ExcelModule {}
