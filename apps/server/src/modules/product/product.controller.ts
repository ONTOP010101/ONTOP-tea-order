import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ProductService } from './product.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('商品管理')
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: '获取商品列表' })
  findAll(@Query() query: any) {
    return this.productService.findAll(query);
  }

  @Get('hot')
  @ApiOperation({ summary: '获取热销商品' })
  getHotProducts(@Query('limit') limit: number) {
    return this.productService.getHotProducts(limit || 10);
  }

  @Get('new')
  @ApiOperation({ summary: '获取新品' })
  getNewProducts(@Query('limit') limit: number) {
    return this.productService.getNewProducts(limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取商品详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建商品' })
  create(@Body() data: any) {
    return this.productService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新商品' })
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.productService.update(id, data);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新商品状态（上架/下架）' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: number) {
    return this.productService.updateStatus(id, status);
  }

  @Put(':id/stock')
  @ApiOperation({ summary: '更新商品库存' })
  updateStock(@Param('id', ParseIntPipe) id: number, @Body('stock') stock: number) {
    return this.productService.updateStock(id, stock);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除商品' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.productService.delete(id);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量导入商品' })
  batchCreate(@Body() data: any[]) {
    return this.productService.batchCreate(data);
  }
}
