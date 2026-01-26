import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  @Post('register')
  async register(
    @Body() body: { username: string; password: string; phone?: string },
  ) {
    return this.authService.register(body.username, body.password, body.phone);
  }

  @Get('userinfo')
  @UseGuards(JwtAuthGuard)
  async getUserInfo(@Request() req) {
    return this.authService.getUserInfo(req.user.userId);
  }
}
