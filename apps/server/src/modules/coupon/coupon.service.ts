import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Coupon } from '../../entities/coupon.entity';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
  ) {}

  async findAll() {
    const now = new Date();
    return this.couponRepository.find({
      where: {
        isActive: true,
        endTime: MoreThan(now),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.couponRepository.findOne({ where: { id: parseInt(id) } });
  }

  async create(data: Partial<Coupon>) {
    const coupon = this.couponRepository.create(data);
    return this.couponRepository.save(coupon);
  }

  async update(id: string, data: Partial<Coupon>) {
    await this.couponRepository.update(parseInt(id), data);
    return this.findOne(id);
  }
}
