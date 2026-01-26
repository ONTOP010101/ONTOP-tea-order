import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from '../../entities/banner.entity';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private bannerRepository: Repository<Banner>,
  ) {}

  // 确保图片路径为相对路径，去除完整URL前缀
  private normalizeImagePath(path: string) {
    if (path && typeof path === 'string') {
      // 如果是完整URL，提取相对路径部分
      if (path.startsWith('http://') || path.startsWith('https://')) {
        const url = new URL(path);
        return url.pathname;
      }
      return path;
    }
    return path;
  }

  // 转换Banner数据，确保图片路径为相对路径
  private transformBanner(banner: any) {
    if (!banner) return banner;
    
    return {
      ...banner,
      image: this.normalizeImagePath(banner.image),
    };
  }

  // 批量转换Banner数据
  private transformBanners(banners: any[]) {
    return banners.map(b => this.transformBanner(b));
  }

  // 创建Banner
  async create(data: any) {
    const banner = this.bannerRepository.create(data);
    return this.transformBanner(await this.bannerRepository.save(banner));
  }

  // 获取所有Banner（按排序和创建时间）
  async findAll(includeInactive = false) {
    const query = this.bannerRepository.createQueryBuilder('banner')
      .orderBy('banner.sort', 'ASC')
      .addOrderBy('banner.created_at', 'DESC');

    if (!includeInactive) {
      query.where('banner.is_active = :isActive', { isActive: true });
    }

    const banners = await query.getMany();
    return this.transformBanners(banners);
  }

  // 获取单个Banner
  async findOne(id: string) {
    const banner = await this.bannerRepository.findOne({ where: { id: parseInt(id) } });
    return this.transformBanner(banner);
  }

  // 更新Banner
  async update(id: string, data: any) {
    await this.bannerRepository.update(id, data);
    return this.findOne(id);
  }

  // 删除Banner
  async delete(id: string) {
    await this.bannerRepository.delete(id);
    return { success: true };
  }

  // 获取活跃Banner列表（前端使用）
  async getActiveBanners() {
    const now = new Date();
    const banners = await this.bannerRepository.createQueryBuilder('banner')
      .where('banner.is_active = :isActive', { isActive: true })
      .andWhere('(banner.start_time IS NULL OR banner.start_time <= :now)', { now })
      .andWhere('(banner.end_time IS NULL OR banner.end_time >= :now)', { now })
      .orderBy('banner.sort', 'ASC')
      .addOrderBy('banner.created_at', 'DESC')
      .getMany();
    
    return this.transformBanners(banners);
  }
}