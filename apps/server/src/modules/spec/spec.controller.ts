import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SpecService } from './spec.service';

@ApiTags('规格管理')
@Controller('spec')
export class SpecController {
  constructor(private specService: SpecService) {}

  // 规格组API
  @Post('group')
  @ApiOperation({ summary: '创建规格组' })
  createSpecGroup(@Body() body: { name: string; name_en?: string; name_ar?: string; name_es?: string; name_pt?: string; isRequired: number; isMultiple: number; sort?: number }) {
    return this.specService.createSpecGroup(body);
  }

  @Put('group/:id')
  @ApiOperation({ summary: '更新规格组' })
  updateSpecGroup(@Param('id') id: number, @Body() body: { name?: string; name_en?: string; name_ar?: string; name_es?: string; name_pt?: string; isRequired?: number; isMultiple?: number; sort?: number }) {
    return this.specService.updateSpecGroup(id, body);
  }

  @Delete('group/:id')
  @ApiOperation({ summary: '删除规格组' })
  deleteSpecGroup(@Param('id') id: number) {
    return this.specService.deleteSpecGroup(id);
  }

  @Get('group/:id')
  @ApiOperation({ summary: '获取规格组详情' })
  getSpecGroupById(@Param('id') id: number) {
    return this.specService.getSpecGroupById(id);
  }

  @Get('groups')
  @ApiOperation({ summary: '获取所有规格组' })
  getAllSpecGroups() {
    return this.specService.getAllSpecGroups();
  }

  // 规格项API
  @Post('item/:groupId')
  @ApiOperation({ summary: '创建规格项' })
  createSpecItem(@Param('groupId') groupId: number, @Body() body: { value: string; value_en?: string; value_ar?: string; value_es?: string; value_pt?: string; price?: number; sort?: number }) {
    return this.specService.createSpecItem(groupId, body);
  }

  @Put('item/:id')
  @ApiOperation({ summary: '更新规格项' })
  updateSpecItem(@Param('id') id: number, @Body() body: { value?: string; value_en?: string; value_ar?: string; value_es?: string; value_pt?: string; price?: number; sort?: number }) {
    return this.specService.updateSpecItem(id, body);
  }

  @Delete('item/:id')
  @ApiOperation({ summary: '删除规格项' })
  deleteSpecItem(@Param('id') id: number) {
    return this.specService.deleteSpecItem(id);
  }

  @Get('item/:id')
  @ApiOperation({ summary: '获取规格项详情' })
  getSpecItemById(@Param('id') id: number) {
    return this.specService.getSpecItemById(id);
  }

  // 商品-规格组绑定API
  @Post('product/:productId/bind/:groupId')
  @ApiOperation({ summary: '绑定规格组到商品' })
  bindSpecGroupToProduct(@Param('productId') productId: number, @Param('groupId') groupId: number, @Query('sort') sort?: number) {
    return this.specService.bindSpecGroupToProduct(productId, groupId, sort);
  }

  @Delete('product/:productId/unbind/:groupId')
  @ApiOperation({ summary: '解除规格组与商品的绑定' })
  unbindSpecGroupFromProduct(@Param('productId') productId: number, @Param('groupId') groupId: number) {
    return this.specService.unbindSpecGroupFromProduct(productId, groupId);
  }

  @Get('product/:productId/groups')
  @ApiOperation({ summary: '获取商品绑定的规格组' })
  getSpecGroupsForProduct(@Param('productId') productId: number) {
    return this.specService.getSpecGroupsForProduct(productId);
  }

  @Get('product/:productId/unbound-groups')
  @ApiOperation({ summary: '获取商品未绑定的规格组' })
  getUnboundSpecGroupsForProduct(@Param('productId') productId: number) {
    return this.specService.getUnboundSpecGroupsForProduct(productId);
  }

  @Put('product/:productId/group/:groupId/sort')
  @ApiOperation({ summary: '更新商品规格组排序' })
  updateSpecGroupSortForProduct(@Param('productId') productId: number, @Param('groupId') groupId: number, @Body('sort') sort: number) {
    return this.specService.updateSpecGroupSortForProduct(productId, groupId, sort);
  }

  @Post('product/:productId/validate')
  @ApiOperation({ summary: '验证规格选择' })
  validateSpecSelection(@Param('productId') productId: number, @Body() body: { selections: { groupId: number; itemIds: number[] }[] }) {
    return this.specService.validateSpecSelection(productId, body.selections);
  }
}
