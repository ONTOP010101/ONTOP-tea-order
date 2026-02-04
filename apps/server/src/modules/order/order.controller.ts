import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Response,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  // 管理端：获取所有订单（不需要JWT验证）
  @Get('admin/all')
  findAll(@Query() query: any) {
    // 管理后台请求：设置requestType为admin，不添加时间限制
    return this.orderService.findAll({ ...query, requestType: 'admin' });
  }

  // 用户端：创建订单
  @Post()
  create(@Request() req, @Body() data: any) {
    console.log('订单控制器接收到的数据:', data);
    // 允许匿名用户创建订单，未登录时使用测试用户id
    const userId = req.user?.userId || '2'; // 使用id=2的测试用户
    return this.orderService.create(userId, data);
  }

  // 用户端：获取自己的订单
  @Get('my')
  @UseGuards(JwtAuthGuard)
  findByUser(@Request() req, @Query() query: any) {
    return this.orderService.findByUser(req.user.userId, query);
  }

  // 获取单个订单详情
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  // 用户取消订单
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() body) {
    return this.orderService.cancel(id, body.sessionId || null);
  }

  // 管理端：更新订单状态
  @Put(':id/status')
  updateStatus(
    @Param('id') id: string, 
    @Body('status') status: 'pending' | 'making' | 'ready' | 'completed' | 'cancelled'
  ) {
    return this.orderService.updateStatus(id, status);
  }

  // 管理端：导出订单为Excel
  @Get('admin/export')
  exportOrders(@Query() query: any, @Response() res) {
    return this.orderService.exportOrders(query, res);
  }

  // 测试打印功能
  @Get('test/print')
  async testPrint() {
    try {
      console.log('开始测试打印功能，格式: txt');
      await this.orderService.testPrintFormat();
      return { code: 200, message: '打印测试成功', data: null };
    } catch (error) {
      console.error('打印测试失败:', error);
      return { code: 500, message: '打印测试失败', data: { error: error.message } };
    }
  }


}
