import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // 转换产品数据，将 sales 映射为 soldCount（H5前端兼容）
  private transformProduct(product: any) {
    if (!product) return product;
    
    // 处理图片字段，确保图片路径为相对路径，去除完整URL前缀
    const normalizeImagePath = (path: string) => {
      if (path && typeof path === 'string') {
        // 如果是完整URL，提取相对路径部分
        if (path.startsWith('http://') || path.startsWith('https://')) {
          const url = new URL(path);
          return url.pathname;
        }
        return path;
      }
      return path;
    };
    
    // 处理图片数组
    let productImages = product.images;
    if (!productImages || productImages.length === 0) {
      if (product.image) {
        productImages = [product.image];
      } else {
        productImages = [];
      }
    }
    
    return {
      ...product,
      image: normalizeImagePath(product.image),
      images: productImages.map((img: string) => normalizeImagePath(img)),
      soldCount: product.sales, // 添加 soldCount 字段供H5使用
      stock: Number(product.stock || 0), // 确保stock是数字，默认为0
    };
  }

  // 批量转换
  private transformProducts(products: any[]) {
    return products.map(p => this.transformProduct(p));
  }

  // 为商品列表添加has_specs字段
  private async addHasSpecsToProducts(products: any[]) {
    if (products.length === 0) {
      return products;
    }

    // 获取所有商品的ID
    const productIds = products.map(p => p.id);

    // 查询所有商品的规格组数量
    const specCounts = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product_spec_groups', 'psg', 'psg.product_id = product.id')
      .select('psg.product_id', 'productId')
      .addSelect('COUNT(*)', 'specCount')
      .where('psg.product_id IN (:...productIds)', { productIds })
      .groupBy('psg.product_id')
      .getRawMany();

    // 创建一个map来存储每个商品的规格组数量
    const specCountMap = new Map<number, number>();
    specCounts.forEach(item => {
      specCountMap.set(Number(item.productId), Number(item.specCount));
    });

    // 转换产品数据，添加has_specs字段
    return products.map(p => {
      const productData = this.transformProduct(p);
      // 从specCountMap中获取该商品的规格组数量
      const specCount = specCountMap.get(p.id) || 0;
      return {
        ...productData,
        has_specs: specCount > 0
      };
    });
  }

  async findAll(params: any) {
    // 同时支持前端的categoryId和后端的category_id参数
    const { page = 1, pageSize = 20, category_id, categoryId, keyword, status } = params;
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    // 如果没有指定status，默认只显示上架商品（前端）
    // 管理后台传status=all可以查看所有
    if (status !== 'all') {
      query.where('product.status = :status', { status: status ? Number(status) : 1 });
    }

    // 当有搜索关键词时，不进行分类过滤，搜索所有分类
    if (keyword) {
      if (status !== 'all') {
        query.where('product.status = :status', { status: status ? Number(status) : 1 });
      }
      // 搜索所有分类中的商品
      query.andWhere('(product.name LIKE :keyword OR product.name_en LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    } else {
      // 当没有搜索关键词时，根据分类ID过滤
      const actualCategoryId = category_id || categoryId;
      if (actualCategoryId) {
        if (status !== 'all') {
          query.andWhere('product.category_id = :category_id', { category_id: Number(actualCategoryId) });
        } else {
          query.where('product.category_id = :category_id', { category_id: Number(actualCategoryId) });
        }
      }
    }

    const [list, total] = await query
      .orderBy('product.sort', 'DESC')
      .addOrderBy('product.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 如果没有商品，直接返回空列表
    if (list.length === 0) {
      return {
        list: [],
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      };
    }

    // 转换产品数据，添加has_specs字段
    const transformedList = await this.addHasSpecsToProducts(list);

    return {
      list: transformedList,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    };
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({ 
      where: { id },
      relations: ['category']
    });

    if (!product) {
      throw new NotFoundException(`商品 ID ${id} 不存在`);
    }

    // 查询该商品的规格组数量
    const specCount = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product_spec_groups', 'psg', 'psg.product_id = product.id')
      .select('COUNT(*)', 'specCount')
      .where('product.id = :id', { id })
      .getRawOne();

    const productData = this.transformProduct(product);
    return {
      ...productData,
      has_specs: (specCount && specCount.specCount) ? Number(specCount.specCount) > 0 : false
    };
  }

  async getHotProducts(limit: number = 10) {
    const list = await this.productRepository.find({
      where: { status: 1 },
      order: { sales: 'DESC' },
      take: limit,
      relations: ['category']
    });

    return this.addHasSpecsToProducts(list);
  }

  async getNewProducts(limit: number = 10) {
    const list = await this.productRepository.find({
      where: { status: 1 },
      order: { created_at: 'DESC' },
      take: limit,
      relations: ['category']
    });

    return this.addHasSpecsToProducts(list);
  }

  // 查找最小的可用ID
  private async findNextAvailableId(): Promise<number> {
    // 获取所有现有ID
    const products = await this.productRepository.find({ select: ['id'] });
    const ids = products.map(product => product.id).sort((a, b) => a - b);
    
    // 查找第一个缺失的ID
    for (let i = 1; i <= ids.length + 1; i++) {
      if (!ids.includes(i)) {
        return i;
      }
    }
    
    // 如果所有ID都连续，返回最大ID+1
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  async create(data: Partial<Product>) {
    // 确保必填字段存在
    if (!data.name || !data.category_id) {
      throw new Error('商品名称和分类ID是必填项');
    }

    // 查找可用ID
    const nextId = await this.findNextAvailableId();

    // 处理images字段
    if (data.images && typeof data.images === 'string') {
      try {
        data.images = JSON.parse(data.images as any);
      } catch (e) {
        data.images = [data.images as any];
      }
    }

    const product = this.productRepository.create({
      ...data,
      id: nextId,
      status: data.status !== undefined ? Number(data.status) : 1,
      stock: data.stock !== undefined ? Number(data.stock) : 0,
      price: data.price !== undefined ? Number(data.price) : 0,
      sort: data.sort !== undefined ? Number(data.sort) : 0,
      sales: 0
    });

    return await this.productRepository.save(product);
  }

  async update(id: number, data: Partial<Product>) {
    const product = await this.productRepository.findOne({ where: { id } });
    
    if (!product) {
      throw new NotFoundException(`商品 ID ${id} 不存在`);
    }

    // 处理images字段
    if (data.images && typeof data.images === 'string') {
      try {
        data.images = JSON.parse(data.images as any);
      } catch (e) {
        data.images = [data.images as any];
      }
    }

    // 转换数值类型
    if (data.status !== undefined) data.status = Number(data.status);
    if (data.stock !== undefined) data.stock = Number(data.stock);
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.sort !== undefined) data.sort = Number(data.sort);
    if (data.category_id !== undefined) data.category_id = Number(data.category_id);

    await this.productRepository.update(id, data);
    return await this.findOne(id);
  }

  async updateStatus(id: number, status: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    
    if (!product) {
      throw new NotFoundException(`商品 ID ${id} 不存在`);
    }

    await this.productRepository.update(id, { status: Number(status) });
    return await this.findOne(id);
  }

  async updateStock(id: number, stock: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    
    if (!product) {
      throw new NotFoundException(`商品 ID ${id} 不存在`);
    }

    await this.productRepository.update(id, { stock: Number(stock) });
    return await this.findOne(id);
  }

  async delete(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    
    if (!product) {
      throw new NotFoundException(`商品 ID ${id} 不存在`);
    }

    await this.productRepository.delete(id);
    return true;
  }

  async batchCreate(dataList: Partial<Product>[]) {
    const products = [];
    
    for (const data of dataList) {
      // 查找可用ID
      const nextId = await this.findNextAvailableId();
      
      // 处理images字段
      if (data.images && typeof data.images === 'string') {
        try {
          data.images = JSON.parse(data.images as any);
        } catch (e) {
          data.images = [data.images as any];
        }
      }

      products.push(this.productRepository.create({
        ...data,
        id: nextId,
        status: data.status !== undefined ? Number(data.status) : 1,
        stock: data.stock !== undefined ? Number(data.stock) : 0,
        price: data.price !== undefined ? Number(data.price) : 0,
        sort: data.sort !== undefined ? Number(data.sort) : 0,
        sales: 0
      }));
    }

    return await this.productRepository.save(products);
  }
}
