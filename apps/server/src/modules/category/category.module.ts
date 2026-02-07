import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category } from '../../entities/category.entity';
import { TranslationModule } from '../../translation/translation.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), TranslationModule],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
