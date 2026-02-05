import { Controller, Get, Post, Put, Delete, Query, Param, Body, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TimeLimitedProductService } from './time-limited-product.service';

@Controller('time-limited-products')
export class TimeLimitedProductController {
  constructor(
    private timeLimitedProductService: TimeLimitedProductService
  ) {}

  // 获取限时推荐商品列表
  @Get()
  @ApiOperation({ summary: '获取限时推荐商品列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数' })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'status', required: false, description: '状态筛选' })
  @ApiResponse({ status: 200, description: '成功' })
  async getTimeLimitedProducts(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string
  ) {
    const result = await this.timeLimitedProductService.findAll({
      page,
      pageSize,
      keyword,
      status
    });

    return {
      code: 200,
      message: 'success',
      data: result
    };
  }

  // 获取单个限时推荐商品
  @Get(':id')
  @ApiOperation({ summary: '获取单个限时推荐商品' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async getTimeLimitedProduct(
    @Param('id') id: number
  ) {
    const result = await this.timeLimitedProductService.findOne(id);

    return {
      code: 200,
      message: 'success',
      data: result
    };
  }

  // 创建限时推荐商品
  @Post()
  @ApiOperation({ summary: '创建限时推荐商品' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async createTimeLimitedProduct(
    @Body() data: {
      product_id: number;
      daily_start_time?: string;
      daily_end_time?: string;
      sort: number;
    }
  ) {
    const result = await this.timeLimitedProductService.create(data);

    return {
      code: 200,
      message: 'success',
      data: result
    };
  }

  // 更新限时推荐商品
  @Put(':id')
  @ApiOperation({ summary: '更新限时推荐商品' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async updateTimeLimitedProduct(
    @Param('id') id: number,
    @Body() data: {
      product_id?: number;
      daily_start_time?: string;
      daily_end_time?: string;
      sort?: number;
    }
  ) {
    const result = await this.timeLimitedProductService.update(id, data);

    return {
      code: 200,
      message: 'success',
      data: result
    };
  }

  // 删除限时推荐商品
  @Delete(':id')
  @ApiOperation({ summary: '删除限时推荐商品' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async deleteTimeLimitedProduct(
    @Param('id') id: number
  ) {
    await this.timeLimitedProductService.delete(id);

    return {
      code: 200,
      message: 'success'
    };
  }

  // 获取当前有效的限时推荐商品
  @Get('active/list')
  @ApiOperation({ summary: '获取当前有效的限时推荐商品' })
  @ApiQuery({ name: 'limit', required: false, description: '数量限制' })
  @ApiResponse({ status: 200, description: '成功' })
  async getActiveTimeLimitedProducts(
    @Query('limit') limit: number = 10
  ) {
    const result = await this.timeLimitedProductService.getActiveTimeLimitedProducts(limit);

    return {
      code: 200,
      message: 'success',
      data: result
    };
  }
}
