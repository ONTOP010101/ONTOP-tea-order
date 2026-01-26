import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecGroup } from '../../entities/spec-group.entity';
import { SpecItem } from '../../entities/spec-item.entity';
import { ProductSpecGroup } from '../../entities/product-spec-group.entity';
import { SpecController } from './spec.controller';
import { SpecService } from './spec.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SpecGroup, SpecItem, ProductSpecGroup]),
  ],
  controllers: [SpecController],
  providers: [SpecService],
  exports: [SpecService],
})
export class SpecModule {}
