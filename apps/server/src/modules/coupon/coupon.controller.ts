import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { CouponService } from './coupon.service';

@Controller('coupons')
export class CouponController {
  constructor(private couponService: CouponService) {}

  @Get()
  findAll() {
    return this.couponService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.couponService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.couponService.update(id, data);
  }
}
