import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('用户管理')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  findAll(@Query() query: any) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  create(@Body() data: any) {
    return this.userService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户信息' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.userService.update(id, data);
  }

  @Put(':id/role')
  @ApiOperation({ summary: '修改用户权限' })
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.userService.updateRole(id, role);
  }

  @Put(':id/password')
  @ApiOperation({ summary: '重置用户密码' })
  resetPassword(@Param('id') id: string, @Body('password') password: string) {
    return this.userService.resetPassword(id, password);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
