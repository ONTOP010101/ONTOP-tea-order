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

  // 计算状态
  calculateStatus(startTime: string, endTime: string): number {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) return 0; // 未开始
    if (now >= start && now <= end) return 1; // 进行中
    return 2; // 已结束
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
        // 更新状态
        const currentStatus = this.calculateStatus(item.start_time, item.end_time);
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

    // 更新状态
    const currentStatus = this.calculateStatus(item.start_time, item.end_time);
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
    start_time: string;
    end_time: string;
    sort: number;
  }) {
    // 检查商品是否存在
    const product = await this.productService.findOne(data.product_id);
    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    // 计算初始状态
    const status = this.calculateStatus(data.start_time, data.end_time);

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
    start_time?: string;
    end_time?: string;
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
    let currentStatus = timeLimitedProduct.status;
    if (data.start_time || data.end_time) {
      const startTime = data.start_time || timeLimitedProduct.start_time;
      const endTime = data.end_time || timeLimitedProduct.end_time;
      currentStatus = this.calculateStatus(startTime, endTime);
      data.status = currentStatus;
    }

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
    const now = new Date();

    const items = await this.timeLimitedProductRepository.createQueryBuilder('tlp')
      .leftJoinAndSelect('tlp.product', 'product')
      .where('tlp.start_time <= :now', { now })
      .andWhere('tlp.end_time >= :now', { now })
      .orderBy('tlp.sort', 'DESC')
      .addOrderBy('tlp.createdAt', 'DESC')
      .take(limit)
      .getMany();

    // 转换商品数据
    const transformedItems = await Promise.all(
      items.map(async (item) => {
        const transformedProduct = await this.productService.transformProduct(item.product);
        return {
          ...item,
          product: transformedProduct
        };
      })
    );

    return transformedItems;
  }
}
