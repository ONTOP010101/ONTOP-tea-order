import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // 自定义提取JWT令牌的函数，当没有令牌时返回null，而不是抛出错误
      jwtFromRequest: (req: Request) => {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          return authHeader.substring(7);
        }
        return null; // 没有令牌时返回null，允许请求继续
      },
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      // 当没有令牌时，不要返回401错误
      passReqToCallback: true,
      // 允许无令牌请求
      jsonWebTokenOptions: {
        ignoreExpiration: false,
      },
    });
  }

  async validate(req: Request, payload: any) {
    if (!payload) {
      return null; // 没有令牌时返回null，允许请求继续
    }
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
