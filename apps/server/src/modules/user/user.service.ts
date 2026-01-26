import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(params: any) {
    const { page = 1, pageSize = 20, role, keyword } = params;
    const query = this.userRepository.createQueryBuilder('user');

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (keyword) {
      query.andWhere('(user.username LIKE :keyword OR user.nickname LIKE :keyword OR user.phone LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    const [list, total] = await query
      .orderBy('user.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 移除密码字段
    const safeList = list.map(user => {
      const { password, ...rest } = user;
      return rest;
    });

    return { list: safeList, total, page, pageSize };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id: parseInt(id) } });
    if (user) {
      const { password, ...rest } = user;
      return rest;
    }
    return null;
  }

  async create(data: any) {
    const { username, password, nickname, phone, role = 'user' } = data;
    
    // 检查用户名是否已存在
    const existUser = await this.userRepository.findOne({ where: { username } });
    if (existUser) {
      throw new Error('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      nickname: nickname || username,
      phone,
      role,
    });

    const saved = await this.userRepository.save(user);
    const { password: _, ...result } = saved;
    return result;
  }

  async update(id: string, data: Partial<User>) {
    // 不允许通过此接口更新密码和角色
    const { password, role, ...updateData } = data;
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async updateRole(id: string, role: string) {
    if (!['admin', 'user'].includes(role)) {
      throw new Error('无效的角色类型');
    }
    await this.userRepository.update(id, { role });
    return this.findOne(id);
  }

  async resetPassword(id: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepository.update(id, { password: hashedPassword });
    return { message: '密码重置成功' };
  }

  async delete(id: string) {
    const user = await this.userRepository.findOne({ where: { id: parseInt(id) } });
    if (user?.role === 'admin') {
      throw new Error('不能删除管理员账户');
    }
    await this.userRepository.delete(parseInt(id));
    return { message: '删除成功' };
  }
}
