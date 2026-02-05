import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeLimitedProduct } from '../../entities/time-limited-product.entity';
import { ProductService } from './product.service';

@Injectable()
export class TimeLimitedProductService {
  constructor(
    @InjectRepository(TimeLimitedProduct)
    private timeLimitedProductRepository: Repository<TimeLimitedProduct>,
    private productService: ProductService
  ) {}

  // 根据每日开始时间和每日结束时间计算状态
  calculateStatusByDailyTime(dailyStartTime?: string, dailyEndTime?: string): number {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    const currentTimeInSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;

    console.log('当前时间:', `${currentHour}:${currentMinute}:${currentSecond}`, '秒数:', currentTimeInSeconds);
    console.log('每日开始时间:', dailyStartTime);
    console.log('每日结束时间:', dailyEndTime);

    // 如果没有设置每日时间，则默认状态为进行中
    if (!dailyStartTime || !dailyEndTime) {
      console.log('未设置每日时间，返回状态: 1 (进行中)');
      return 1; // 进行中
    }

    try {
      // 解析每日开始时间
      const startParts = dailyStartTime.split(':').map(Number);
      const startHour = startParts[0];
      const startMinute = startParts[1];
      const startSecond = startParts[2] || 0;
      const startTimeInSeconds = startHour * 3600 + startMinute * 60 + startSecond;

      // 解析每日结束时间
      const endParts = dailyEndTime.split(':').map(Number);
      const endHour = endParts[0];
      const endMinute = endParts[1];
      const endSecond = endParts[2] || 0;
      const endTimeInSeconds = endHour * 3600 + endMinute * 60 + endSecond;

      console.log('开始时间:', `${startHour}:${startMinute}:${startSecond}`, '秒数:', startTimeInSeconds);
      console.log('结束时间:', `${endHour}:${endMinute}:${endSecond}`, '秒数:', endTimeInSeconds);

      // 检查当前时间是否在每日开始时间和每日结束时间之间
      if (currentTimeInSeconds >= startTimeInSeconds && currentTimeInSeconds <= endTimeInSeconds) {
        console.log('当前时间在开始时间和结束时间之间，返回状态: 1 (进行中)');
        return 1; // 进行中
      } else if (currentTimeInSeconds < startTimeInSeconds) {
        console.log('当前时间在开始时间之前，返回状态: 0 (未开始)');
        return 0; // 未开始
      } else {
        console.log('当前时间在结束时间之后，返回状态: 2 (已结束)');
        return 2; // 已结束
      }
    } catch (error) {
      console.error('解析时间字符串失败:', error);
      return 1; // 出错时默认状态为进行中
    }
  }

  // 加载限时推荐商品列表
  async findAll(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    status?: string;
  }) {
    const { page, pageSize, keyword, status } = params;
    const skip = (page - 1) * pageSize;

    const query = this.timeLimitedProductRepository.createQueryBuilder('tlp')
      .leftJoinAndSelect('tlp.product', 'product')
      .orderBy('tlp.sort', 'DESC')
      .addOrderBy('tlp.created_at', 'DESC');

    // 关键词搜索
    if (keyword) {
      query.andWhere('product.name LIKE :keyword', { keyword: `%${keyword}%` });
    }

    // 状态筛选
    if (status) {
      query.andWhere('tlp.status = :status', { status });
    }

    const [items, total] = await query
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    // 转换商品数据
    const transformedItems = await Promise.all(
      items.map(async (item) => {
        // 根据每日时间计算当前状态
        const currentStatus = this.calculateStatusByDailyTime(item.daily_start_time, item.daily_end_time);
        
        // 如果状态发生变化，更新状态
        if (item.status !== currentStatus) {
          item.status = currentStatus;
          await this.timeLimitedProductRepository.save(item);
          
          // 根据状态更新商品的上架/下架状态
          if (currentStatus === 1) {
            // 进行中状态，自动上架商品
            await this.productService.updateStatus(item.product_id, 1);
          } else if (currentStatus === 2) {
            // 已结束状态，自动下架商品（不管库存情况）
            await this.productService.updateStatus(item.product_id, 0);
          }
        }
        
        // 转换商品数据
        const transformedProduct = await this.productService.transformProduct(item.product);
        
        return {
          ...item,
          product: transformedProduct
        };
      })
    );

    return {
      list: transformedItems,
      total,
      page,
      pageSize
    };
  }

  // 加载单个限时推荐商品
  async findOne(id: number) {
    const item = await this.timeLimitedProductRepository.findOne({
      where: { id },
      relations: ['product']
    });

    if (!item) {
      throw new NotFoundException('限时推荐商品不存在');
    }

    // 根据每日时间计算当前状态
    const currentStatus = this.calculateStatusByDailyTime(item.daily_start_time, item.daily_end_time);
    
    // 如果状态发生变化，更新状态
    if (item.status !== currentStatus) {
      item.status = currentStatus;
      await this.timeLimitedProductRepository.save(item);
      
      // 根据状态更新商品的上架/下架状态
      if (currentStatus === 1) {
        // 进行中状态，自动上架商品
        await this.productService.updateStatus(item.product_id, 1);
      } else if (currentStatus === 2) {
        // 已结束状态，自动下架商品（不管库存情况）
        await this.productService.updateStatus(item.product_id, 0);
      }
    }

    // 转换商品数据
    const transformedProduct = await this.productService.transformProduct(item.product);

    return {
      ...item,
      product: transformedProduct
    };
  }

  // 创建限时推荐商品
  async create(data: {
    product_id: number;
    daily_start_time?: string;
    daily_end_time?: string;
    sort: number;
  }) {
    // 检查商品是否存在
    const product = await this.productService.findOne(data.product_id);
    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    // 根据每日时间计算初始状态
    const status = this.calculateStatusByDailyTime(data.daily_start_time, data.daily_end_time);

    // 根据状态更新商品的上架/下架状态
    if (status === 1) {
      // 进行中状态，自动上架商品
      await this.productService.updateStatus(data.product_id, 1);
    } else if (status === 2) {
      // 已结束状态，自动下架商品（不管库存情况）
      await this.productService.updateStatus(data.product_id, 0);
    }

    const timeLimitedProduct = this.timeLimitedProductRepository.create({
      ...data,
      status
    });

    return await this.timeLimitedProductRepository.save(timeLimitedProduct);
  }

  // 更新限时推荐商品
  async update(id: number, data: {
    product_id?: number;
    daily_start_time?: string;
    daily_end_time?: string;
    sort?: number;
    status?: number;
  }) {
    const timeLimitedProduct = await this.timeLimitedProductRepository.findOne({
      where: { id }
    });

    if (!timeLimitedProduct) {
      throw new NotFoundException('限时推荐商品不存在');
    }

    // 检查商品是否存在
    if (data.product_id) {
      const product = await this.productService.findOne(data.product_id);
      if (!product) {
        throw new NotFoundException('商品不存在');
      }
    }

    // 计算新状态
    const dailyStartTime = data.daily_start_time || timeLimitedProduct.daily_start_time;
    const dailyEndTime = data.daily_end_time || timeLimitedProduct.daily_end_time;
    const currentStatus = this.calculateStatusByDailyTime(dailyStartTime, dailyEndTime);
    data.status = currentStatus;

    // 保存更新
    Object.assign(timeLimitedProduct, data);
    await this.timeLimitedProductRepository.save(timeLimitedProduct);

    // 根据状态更新商品的上架/下架状态
    const productId = data.product_id || timeLimitedProduct.product_id;
    if (currentStatus === 1) {
      // 进行中状态，自动上架商品
      await this.productService.updateStatus(productId, 1);
    } else if (currentStatus === 2) {
      // 已结束状态，自动下架商品（不管库存情况）
      await this.productService.updateStatus(productId, 0);
    }

    return timeLimitedProduct;
  }

  // 删除限时推荐商品
  async delete(id: number) {
    const timeLimitedProduct = await this.timeLimitedProductRepository.findOne({
      where: { id }
    });

    if (!timeLimitedProduct) {
      throw new NotFoundException('限时推荐商品不存在');
    }

    return await this.timeLimitedProductRepository.remove(timeLimitedProduct);
  }

  // 获取当前有效的限时推荐商品
  async getActiveTimeLimitedProducts(limit: number = 10) {
    const items = await this.timeLimitedProductRepository.createQueryBuilder('tlp')
      .leftJoinAndSelect('tlp.product', 'product')
      .orderBy('tlp.sort', 'DESC')
      .addOrderBy('tlp.created_at', 'DESC')
      .take(limit)
      .getMany();

    // 转换商品数据并过滤出当前有效的商品
    const transformedItems = await Promise.all(
      items.map(async (item) => {
        // 根据每日时间计算当前状态
        const currentStatus = this.calculateStatusByDailyTime(item.daily_start_time, item.daily_end_time);
        
        // 如果状态发生变化，更新状态
        if (item.status !== currentStatus) {
          item.status = currentStatus;
          await this.timeLimitedProductRepository.save(item);
          
          // 根据状态更新商品的上架/下架状态
          if (currentStatus === 1) {
            // 进行中状态，自动上架商品
            await this.productService.updateStatus(item.product_id, 1);
          } else if (currentStatus === 2) {
            // 已结束状态，自动下架商品（不管库存情况）
            await this.productService.updateStatus(item.product_id, 0);
          }
        }
        
        // 转换商品数据
        const transformedProduct = await this.productService.transformProduct(item.product);
        
        return {
          ...item,
          product: transformedProduct
        };
      })
    );

    // 只返回进行中的商品
    return transformedItems.filter(item => item.status === 1);
  }
}
