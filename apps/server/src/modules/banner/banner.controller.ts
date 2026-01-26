import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { BannerService } from './banner.service';

@Controller('banners')
export class BannerController {
  constructor(private bannerService: BannerService) {}

  // 管理端：创建Banner
@Post()
async create(@Body() data: any) {
  return await this.bannerService.create(data);
}

// 管理端：获取所有Banner（支持包含不活跃的）
@Get()
async findAll(@Query('includeInactive') includeInactive?: string) {
  const includeInactiveBool = includeInactive === 'true';
  return await this.bannerService.findAll(includeInactiveBool);
}

// 管理端：获取单个Banner
@Get(':id')
async findOne(@Param('id') id: string) {
  return await this.bannerService.findOne(id);
}

// 管理端：更新Banner
@Put(':id')
async update(@Param('id') id: string, @Body() data: any) {
  return await this.bannerService.update(id, data);
}

// 管理端：删除Banner
@Delete(':id')
async delete(@Param('id') id: string) {
  return await this.bannerService.delete(id);
}

// 前端：获取活跃Banner列表
@Get('active/list')
async getActiveBanners() {
  return await this.bannerService.getActiveBanners();
}
}