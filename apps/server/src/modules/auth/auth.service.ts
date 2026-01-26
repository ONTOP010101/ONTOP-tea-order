import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.username = :username', { username })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    delete user.password;

    return {
      token,
      user,
    };
  }

  async register(username: string, password: string, phone?: string) {
    const existUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existUser) {
      throw new UnauthorizedException('用户名已存在');
    }

    const user = this.userRepository.create({
      username,
      password,
      phone,
    });

    await this.userRepository.save(user);

    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    delete user.password;

    return {
      token,
      user,
    };
  }

  async getUserInfo(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: parseInt(userId) } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return user;
  }
}
