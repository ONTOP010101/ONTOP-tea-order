import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from '../../entities/order.entity';
import { WebsocketModule } from '../websocket/websocket.module';
import { ProductModule } from '../product/product.module';
import { SpecModule } from '../spec/spec.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), WebsocketModule, ProductModule, SpecModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
