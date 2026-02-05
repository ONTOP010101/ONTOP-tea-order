import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Order } from '../../entities/order.entity';
import { OrderGateway } from '../websocket/order.gateway';
import { ProductService } from '../product/product.service';
import { SpecService } from '../spec/spec.service';
import { UserService } from '../user/user.service';
import dayjs from 'dayjs';

// 导入node-printer库
const printer = require('node-printer');
const fs = require('fs');
const path = require('path');

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private orderGateway: OrderGateway,
    private productService: ProductService,
    private specService: SpecService,
    private userService: UserService,
  ) {}

  private async generateOrderNo(): Promise<string> {
    // 使用基于时间戳的订单号生成方式，确保唯一性
    // 格式：年月日时分秒 + 3位随机数
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // 取年份后两位
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // 生成13位订单号：YYMMDDHHmmss + 3位随机数
    return `${year}${month}${day}${hour}${minute}${second}${random}`;
  }

  async create(userId: string, data: any) {
    console.log('订单创建请求数据:', data);
    console.log('用户ID:', userId);
    
    try {
      // 确保用户ID对应的用户存在，不存在则创建一个默认用户
      let finalUserId: number;
      try {
        // 尝试获取用户信息
        const user = await this.userService.findOne(userId);
        if (user) {
          finalUserId = parseInt(userId);
        } else {
          // 用户不存在，创建一个默认用户
          console.log('用户不存在，创建默认用户...');
          const defaultUser = await this.userService.create({
            username: `guest_${Date.now()}`,
            password: 'password123',
            nickname: '匿名用户',
            phone: '',
            role: 'user'
          });
          finalUserId = defaultUser.id;
          console.log('默认用户创建成功，ID:', finalUserId);
        }
      } catch (error) {
        console.log('获取用户失败，创建默认用户...');
        // 发生错误，创建一个默认用户
        const defaultUser = await this.userService.create({
          username: `guest_${Date.now()}`,
          password: 'password123',
          nickname: '匿名用户',
          phone: '',
          role: 'user'
        });
        finalUserId = defaultUser.id;
        console.log('默认用户创建成功，ID:', finalUserId);
      }
      
      const order_no = await this.generateOrderNo();
      
      // 处理商品信息，强制使用中文名称和中文规格，并检查库存
      const processedItems = await Promise.all(data.items.map(async (item: any) => {
        // 根据商品ID获取完整商品信息
        const product = await this.productService.findOne(parseInt(item.productId));
        console.log('商品信息:', product);
        
        if (!product) {
          throw new Error(`商品不存在: ${item.productId}`);
        }
        
        // 检查库存是否充足
        const requiredStock = item.quantity || 1;
        if (product.stock < requiredStock) {
          throw new Error(`商品库存不足: ${product.name}，当前库存: ${product.stock}，需要: ${requiredStock}`);
        }
        
        // 复制商品信息，强制使用中文名称
        const processedItem = {
          ...item,
          name: product.name, // 强制使用数据库中的中文名称
          image: product.image || item.image, // 使用数据库中的图片
          category: product.category?.name || '', // 添加商品分类信息
        };
        
        // 如果有规格信息，重新生成中文规格文本
        if (item.specs && item.specs.selected) {
          let specText = '';
          const selectedSpecs = item.specs.selected;
          
          // 遍历所有选中的规格组
          for (const [groupId, itemIds] of Object.entries(selectedSpecs)) {
            const groupIdNum = parseInt(groupId);
            // 获取规格组信息
            const group = await this.specService.getSpecGroupById(groupIdNum);
            
            if (group && Array.isArray(itemIds) && itemIds.length > 0) {
              // 获取规格项信息
              const items = await Promise.all(itemIds.map(async (itemId: number) => {
                return await this.specService.getSpecItemById(itemId);
              }));
              
              // 生成中文规格文本
              const itemValues = items
                .filter(Boolean)
                .map(specItem => specItem.value) // 使用中文规格项值
                .join(', ');
              
              specText += `${group.name}: ${itemValues}; `; // 使用中文规格组名
            }
          }
          
          // 更新规格文本为中文
          processedItem.specs = {
            ...item.specs,
            text: specText.trim().replace(/;$/, '')
          };
        }
        
        return processedItem;
      }));
      
      const order = this.orderRepository.create({
        order_no,
        user_id: finalUserId, // 使用确保存在的用户ID
        session_id: data.sessionId || null,
        items: JSON.stringify(processedItems), // 将处理后的items数组序列化为JSON字符串
        total_amount: data.totalAmount,
        discount_amount: data.discountAmount || 0,
        final_amount: data.finalAmount || data.totalAmount,
        remark: data.remark,
        status: 'pending',
      });

      console.log('创建的订单实体:', order);
      
      const savedOrder = await this.orderRepository.save(order);
      console.log('保存后的订单:', savedOrder);

      // 将JSON字符串反序列化为数组
      savedOrder.items = JSON.parse(savedOrder.items);
      console.log('处理后的订单:', savedOrder);

      // 减少商品库存
      if (Array.isArray(savedOrder.items)) {
        for (const item of savedOrder.items) {
          if (typeof item === 'object' && item !== null) {
            const productId = parseInt(item.productId as string);
            const quantity = (item.quantity as number) || 1;
            
            try {
              // 获取当前商品信息
              const currentProduct = await this.productService.findOne(productId);
              if (currentProduct) {
                // 计算新库存
                const newStock = currentProduct.stock - quantity;
                // 更新库存
                await this.productService.updateStock(productId, newStock);
                console.log(`商品 ${currentProduct.name} 库存已更新: ${currentProduct.stock} -> ${newStock}`);
                
                // 当库存变为0时，自动下架商品
                if (newStock === 0) {
                  console.log(`商品 ${currentProduct.name} 库存为0，自动下架`);
                  await this.productService.updateStatus(productId, 0);
                  console.log(`商品 ${currentProduct.name} 已成功下架`);
                }
              }
            } catch (error) {
              console.error(`更新商品库存失败: ${productId}`, error);
              // 库存更新失败不影响订单创建，只记录错误
            }
          }
        }
      }

      // WebSocket实时推送新订单 - 添加try-catch防止WebSocket错误影响订单创建
      try {
        console.log('🔔 准备推送新订单到WebSocket:', savedOrder);
        this.orderGateway.notifyNewOrder(savedOrder);
        console.log('✅ WebSocket推送成功');
      } catch (wsError: any) {
        console.error('❌ WebSocket推送失败:', wsError.message, wsError.stack);
      }

      // 自动触发服务器端打印 - 添加try-catch防止打印错误影响订单创建
      try {
        console.log('🖨️  准备执行服务器端打印:', savedOrder);
        await this.printOrder(savedOrder);
        console.log('✅ 服务器端打印成功');
      } catch (printError: any) {
        console.error('❌ 服务器端打印失败:', printError.message, printError.stack);
      }

      return savedOrder;
    } catch (error) {
      console.error('订单创建失败:', error);
      throw error;
    }
  }

  async findByUser(userId: string, params: any) {
    const { page = 1, pageSize = 20, status } = params;
    const query = this.orderRepository
      .createQueryBuilder('order')
      .select([
        'order.id',
        'order.order_no',
        'order.user_id',
        'order.items',
        'order.total_amount',
        'order.discount_amount',
        'order.final_amount',
        'order.status',
        'order.remark',
        'order.created_at',
        'order.updated_at'
      ])
      .where('order.user_id = :userId', { userId: parseInt(userId) });

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    const [list, total] = await query
      .orderBy('order.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 将items字段从JSON字符串反序列化为数组
    const processedList = list.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));

    return { list: processedList, total, page, pageSize };
  }

  async findOne(id: string) {
    const order = await this.orderRepository.createQueryBuilder('order')
      .select([
        'order.id',
        'order.order_no',
        'order.user_id',
        'order.items',
        'order.total_amount',
        'order.discount_amount',
        'order.final_amount',
        'order.status',
        'order.remark',
        'order.created_at',
        'order.updated_at'
      ])
      .where('order.id = :id', { id: parseInt(id) })
      .getOne();

    if (order) {
      // 将items字段从JSON字符串反序列化为数组
      order.items = JSON.parse(order.items);
    }

    return order;
  }

  async updateStatus(id: string, status: 'pending' | 'making' | 'ready' | 'completed' | 'cancelled') {
    // 获取订单当前状态
    const currentOrder = await this.findOne(id);
    
    await this.orderRepository.update(id, { status });
    const updatedOrder = await this.findOne(id);
    
    // 如果订单状态从非cancelled变为cancelled，返回库存
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      console.log('订单状态更新为已取消，开始返回商品库存');
      
      // 返回商品库存
      try {
        let items = [];
        if (updatedOrder.items) {
          if (Array.isArray(updatedOrder.items)) {
            items = updatedOrder.items;
          } else if (typeof updatedOrder.items === 'string') {
            items = JSON.parse(updatedOrder.items);
          }
        }
        
        console.log('取消订单时的商品信息:', items);
        
        if (Array.isArray(items) && items.length > 0) {
          console.log('开始返回商品库存，共', items.length, '个商品');
          for (const item of items) {
            console.log('处理商品:', item);
            if (typeof item === 'object' && item !== null) {
              const productId = parseInt(item.productId as string);
              const quantity = (item.quantity as number) || 1;
              
              console.log('商品ID:', productId, '，数量:', quantity);
              
              try {
                // 获取当前商品信息
                const currentProduct = await this.productService.findOne(productId);
                console.log('当前商品信息:', currentProduct);
                if (currentProduct) {
                  // 计算新库存（返回库存）
                  const newStock = currentProduct.stock + quantity;
                  console.log('库存更新前:', currentProduct.stock, '，更新后:', newStock);
                  // 更新库存
                  await this.productService.updateStock(productId, newStock);
                  console.log(`商品 ${currentProduct.name} 库存已返回: ${currentProduct.stock} -> ${newStock}`);
                  
                  // 当库存从0变为大于0时，自动上架商品
                  if (currentProduct.stock === 0 && newStock > 0) {
                    console.log(`商品 ${currentProduct.name} 库存恢复，自动上架`);
                    await this.productService.updateStatus(productId, 1);
                    console.log(`商品 ${currentProduct.name} 已成功上架`);
                  }
                }
              } catch (error) {
                console.error(`返回商品库存失败: ${productId}`, error);
                // 库存返回失败不影响订单状态更新，只记录错误
              }
            }
          }
        } else {
          console.log('没有商品信息需要返回库存');
        }
      } catch (error) {
        console.error('处理库存返回时发生错误:', error);
      }
    }
    
    // WebSocket推送订单状态变更
    this.orderGateway.notifyOrderStatusChange(updatedOrder);
    
    return updatedOrder;
  }

  async exportOrders(query: any, res: any) {
    // 导入exceljs库
    const ExcelJS = require('exceljs');
    const fs = require('fs');
    const path = require('path');
    
    let list: any[];
    
    // 如果有ids参数，只导出指定id的订单
    if (query.ids) {
      const ids = query.ids.split(',').map((id: string) => parseInt(id));
      list = await this.orderRepository.findByIds(ids);
      
      // 处理items字段
      list = list.map(order => ({
        ...order,
        items: JSON.parse(order.items)
      }));
    } else {
      // 否则导出所有订单，不分页
      const result = await this.findAll({ ...query, page: 1, pageSize: 10000 });
      list = result.list;
    }
    
    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    // 添加工作表
    const worksheet = workbook.addWorksheet('订单列表');
    
    // 设置列宽
    worksheet.columns = [
      { header: '订单号', key: 'order_no', width: 15, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
      { header: '图片', key: 'image', width: 20, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
      { header: '类型', key: 'type', width: 20, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
      { header: '下单数量', key: 'quantity', width: 12, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
      { header: '下单金额', key: 'amount', width: 12, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
      { header: '下单时间', key: 'time', width: 25, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
      { header: '备注', key: 'remark', width: 30, style: { alignment: { horizontal: 'left', vertical: 'middle' } } }
    ];
    
    // 设置表头样式
    worksheet.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 12
    };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF409EFF' }
    };
    worksheet.getRow(1).border = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
    };
    
    // 遍历订单数据，添加到工作表
    let rowIndex = 2; // 从第二行开始，第一行为表头
    for (const order of list) {
      const items = order.items;
      
      for (const item of items) {
        // 添加数据行
        const row = worksheet.addRow({
          order_no: order.order_no,
          type: item.name || '',
          quantity: item.quantity,
          amount: order.final_amount,
          time: new Date(order.created_at).toLocaleString('zh-CN'),
          remark: order.remark || ''
        });
        
        // 设置行高
        row.height = 80;
        
        // 设置边框
        row.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
        
        // 插入图片
        if (item.image) {
          try {
            // 获取图片完整路径
            // 使用process.cwd()获取当前工作目录，确保路径正确
            const imagePath = path.join(process.cwd(), 'uploads', item.image.replace('/uploads/', ''));
            
            // 检查图片文件是否存在
            if (fs.existsSync(imagePath)) {
              // 添加图片
              const imageId = workbook.addImage({
                buffer: fs.readFileSync(imagePath),
                extension: item.image.split('.').pop() || 'jpeg'
              });
              
              // 插入图片到指定单元格，完全嵌入单元格
              // 设置图片大小，使其适应单元格
              const cellWidth = 20; // 单元格宽度（Excel列宽单位）
              const cellHeight = 80; // 单元格高度（像素）
              
              // Excel列宽与像素的换算关系：1列宽 ≈ 6像素
              const maxWidth = cellWidth * 6;
              const maxHeight = cellHeight;
              
              // 获取图片原始尺寸
              const imageInfo = workbook.images[workbook.images.length - 1];
              let width = imageInfo.size.width;
              let height = imageInfo.size.height;
              
              // 计算宽高比
              const aspectRatio = width / height;
              
              // 调整图片大小，保持宽高比，使其适应单元格
              if (width > maxWidth || height > maxHeight) {
                if (width / maxWidth > height / maxHeight) {
                  width = maxWidth;
                  height = width / aspectRatio;
                } else {
                  height = maxHeight;
                  width = height * aspectRatio;
                }
              }
              
              // 计算图片在单元格中的位置，使其居中
              const offsetX = (maxWidth - width) / 2;
              const offsetY = (maxHeight - height) / 2;
              
              // 插入图片到指定单元格，完全嵌入，居中显示
              worksheet.addImage(imageId, {
                tl: { col: 1, row: rowIndex - 1 }, // B列，行索引从0开始
                ext: { width, height },
                editAs: 'oneCell'
              });
            }
          } catch (error) {
            console.error('插入图片失败:', error);
          }
        }
        
        rowIndex++;
      }
    }
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
    
    // 写入响应流
    await workbook.xlsx.write(res);
    res.end();
  }

  async cancel(id: string, sessionId: string | null) {
    const order = await this.orderRepository.createQueryBuilder('order')
      .select([
        'order.id',
        'order.user_id',
        'order.session_id',
        'order.status',
        'order.items'
      ])
      .where('order.id = :id', { id: parseInt(id) })
      .getOne();
    
    if (!order) {
      throw new Error('订单不存在');
    }
    
    // 验证订单归属：通过session_id或user_id
    if (sessionId && order.session_id !== sessionId) {
      throw new Error('无权操作此订单');
    }
    
    if (order.status !== 'pending') {
      throw new Error('订单状态不允许取消');
    }
    
    // 更新订单状态为已取消
    const cancelledOrder = await this.updateStatus(id, 'cancelled');
    
    // 返回商品库存
    try {
      let items = [];
      if (cancelledOrder.items) {
        if (Array.isArray(cancelledOrder.items)) {
          items = cancelledOrder.items;
        } else if (typeof cancelledOrder.items === 'string') {
          items = JSON.parse(cancelledOrder.items);
        }
      }
      
      console.log('取消订单时的商品信息:', items);
      
      if (Array.isArray(items) && items.length > 0) {
        console.log('开始返回商品库存，共', items.length, '个商品');
        for (const item of items) {
          console.log('处理商品:', item);
          if (typeof item === 'object' && item !== null) {
            const productId = parseInt(item.productId as string);
            const quantity = (item.quantity as number) || 1;
            
            console.log('商品ID:', productId, '，数量:', quantity);
            
            try {
              // 获取当前商品信息
              const currentProduct = await this.productService.findOne(productId);
              console.log('当前商品信息:', currentProduct);
              if (currentProduct) {
                // 计算新库存（返回库存）
                const newStock = currentProduct.stock + quantity;
                console.log('库存更新前:', currentProduct.stock, '，更新后:', newStock);
                // 更新库存
                await this.productService.updateStock(productId, newStock);
                console.log(`商品 ${currentProduct.name} 库存已返回: ${currentProduct.stock} -> ${newStock}`);
                
                // 当库存从0变为大于0时，自动上架商品
                if (currentProduct.stock === 0 && newStock > 0) {
                  console.log(`商品 ${currentProduct.name} 库存恢复，自动上架`);
                  await this.productService.updateStatus(productId, 1);
                  console.log(`商品 ${currentProduct.name} 已成功上架`);
                }
              }
            } catch (error) {
              console.error(`返回商品库存失败: ${productId}`, error);
              // 库存返回失败不影响订单取消，只记录错误
            }
          }
        }
      } else {
        console.log('没有商品信息需要返回库存');
      }
    } catch (error) {
      console.error('处理库存返回时发生错误:', error);
    }
    
    return cancelledOrder;
  }

  // 管理端查询所有订单，支持按session_id筛选
  async findAll(params: any) {
    const { page = 1, pageSize = 20, status, sessionId, requestType = 'frontend' } = params;
    const query = this.orderRepository.createQueryBuilder('order')
      .select([
        'order.id',
        'order.order_no',
        'order.user_id',
        'order.session_id',
        'order.items',
        'order.total_amount',
        'order.discount_amount',
        'order.final_amount',
        'order.status',
        'order.remark',
        'order.created_at',
        'order.updated_at'
      ]);

    // 按状态筛选
    if (status) {
      query.where('order.status = :status', { status });
    }
    
    // 按session_id筛选（游客只能看到自己的订单）
    if (sessionId) {
      if (status) {
        query.andWhere('order.session_id = :sessionId', { sessionId });
      } else {
        query.where('order.session_id = :sessionId', { sessionId });
      }
    }

    // 根据请求类型添加不同的时间过滤
    if (requestType !== 'admin') {
      const expirationTime = new Date();
      if (requestType === 'display') {
        // 订单显示屏：只返回24小时内的订单
        expirationTime.setHours(expirationTime.getHours() - 24);
      } else {
        // 前端：返回7天内的订单
        expirationTime.setDate(expirationTime.getDate() - 7);
      }
      query.andWhere('order.created_at >= :expirationTime', { expirationTime });
    }
    // 管理后台：不添加时间过滤，返回所有订单

    const [list, total] = await query
      .orderBy('order.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 将items字段从JSON字符串反序列化为数组
    const processedList = list.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));

    return {
      list: processedList,
      total,
      page,
      pageSize
    };
  }

  // 清理过期订单（已禁用自动清理，订单永久保存）
  async clearExpiredOrders(): Promise<void> {
    // 禁用自动清理订单功能，订单将永久保存
    // 如需清理订单，请手动执行
    console.log('订单自动清理功能已禁用，订单将永久保存');
  }
  
  // 清理订单显示屏过期订单（超过24小时）
  async clearDisplayOrders(): Promise<void> {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() - 24);
    
    await this.orderRepository.createQueryBuilder()
      .delete()
      .from(Order)
      .where('created_at < :expirationTime', { expirationTime })
      .execute();
  }
  
  // 定时任务：每日0点自动清理订单显示屏的订单
  @Cron('0 0 * * *') // 每日0点执行
  async handleDailyCleanup() {
    try {
      console.log('🔄 开始每日0点清理订单显示屏过期订单...');
      await this.clearDisplayOrders();
      console.log('✅ 每日0点清理订单显示屏过期订单完成');
    } catch (error) {
      console.error('❌ 每日0点清理订单显示屏过期订单失败:', error);
    }
  }

  // 格式化商品名称，直接返回
  private formatProductName(name: string, maxNameLength: number = 7): string {
    if (!name) {
      return '未知商品';
    }
    
    // 直接返回商品名称，不添加任何填充
    return name;
  }

  // 计算订单中商品名称的最大长度
  private getMaxNameLength(items: any[]): number {
    let maxLength = 2; // 最小长度为2
    items.forEach(item => {
      const name = item.name || '';
      if (name.length > maxLength) {
        maxLength = name.length;
      }
    });
    return maxLength;
  }





  // 生成打印内容 - 按照用户详细要求的格式
  private generatePrintContent(order: any): string {
    const items = order.items || [];
    const orderNo = order.order_no;
    const createdAt = new Date(order.created_at);
    const dateStr = new Date(order.created_at).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // 定义分隔线
    const divider = '========================';
    
    // 构建打印内容
    let content = '';
    content += '\n';
    content += `${divider}\n`;
    
    // ON TOP 和 悦翔茶歇，居中对齐
    const centerIndent = ' '.repeat(22);
    content += `${centerIndent}ON TOP\n`;
    content += `${centerIndent}悦翔茶歇\n`;
    content += `${divider}\n`;
    
    // 订单号: 左对齐，订单号值右对齐
    const orderNoIndent = ' '.repeat(18);
    content += `订单号: ${orderNoIndent}${orderNo}\n`;
    content += `${divider}\n`;
    
    // 商品明细
    content += `商品明细\n`;
    content += `${divider}\n`;

    // 添加商品明细
    items.forEach((item: any) => {
      const name = item.name || '未知商品';
      const quantity = item.quantity || 1;
      
      // 格式化商品名称和数量，使用"商品名称  X数量"格式
      content += `${name}  X${quantity}\n`;
      
      // 显示规格组信息
      if (item.specs && item.specs.text) {
        content += `温度:${item.specs.text}\n`;
      }
    });

    content += `${divider}\n`;
    // 备注
    content += `备注:\n`;
    content += `${order.remark || '无'}\n`;
    content += `${divider}\n`;
    
    // 时间，右对齐
    const timeIndent = ' '.repeat(16);
    content += `时间: ${timeIndent}${dateStr}\n`;
    content += '\n\n\n';

    return content;
  }

  // 测试打印格式
  async testPrintFormat(): Promise<void> {
    console.log('开始测试打印格式...');
    console.log('测试格式: txt');
    
    try {
      // 创建测试订单数据
      const testOrder = {
        order_no: 'TEST001',
        created_at: new Date(),
        items: [
          {
            name: '绿茶',
            quantity: 1
          },
          {
            name: '老红糖生姜鲜奶',
            quantity: 1
          }
        ],
        remark: '测试订单'
      };
      
      // 生成TXT打印内容
      console.log('生成TXT打印内容...');
      const printContent = this.generatePrintContent(testOrder);
      console.log('测试打印内容:');
      console.log(printContent);
      
      // 保存测试文件
      const tempFilePath = path.join(__dirname, `test_order_format.txt`);
      fs.writeFileSync(tempFilePath, printContent);
      console.log('测试文件保存成功:', tempFilePath);
      
      console.log('TXT打印测试完成');
    } catch (error) {
      console.error('测试打印格式失败:', error);
      console.error('错误堆栈:', error.stack);
    } finally {
      console.log('测试打印格式方法执行完成');
    }
  }

  // 使用ESC/POS命令打印
  private async printWithEscPos(order: any): Promise<void> {
    console.log('====================================');
    console.log('开始ESC/POS打印流程，订单号:', order.order_no);
    console.log('====================================');
    
    try {
      const escpos = require('escpos');
      const devices = escpos.USB.findPrinter();
      
      console.log('找到的打印机设备:', devices);
      
      if (devices && devices.length > 0) {
        console.log('使用USB连接打印机');
        const device = new escpos.USB();
        const printer = new escpos.Printer(device);
        
        device.open(() => {
          console.log('✓ 打印机连接成功');
          
          // 初始化打印机
          printer
            .font('a')
            .align('ct')
            .style('bu')
            .size(1, 1)
            .text('ON TOP')
            .text('悦翔茶歇')
            .align('lt')
            .style('normal')
            .size(1, 0)
            // 调整行高为30点，恢复默认行高
            .setLineHeight(30)
            .text('--------------------------------');
          
          // 打印订单号
          printer
            .text(`订单号: ${order.order_no}`)
            .text('--------------------------------');
          
          // 打印商品明细标题
          printer
            .text('商品名称                  数量')
            .text('--------------------------------');
          
          // 打印商品明细
          const items = order.items || [];
          items.forEach((item: any) => {
            const name = item.name || '未知商品';
            const quantity = item.quantity || 1;
            
            // 使用简单可靠的对齐方式
            const maxNameLength = 12;
            let paddedName = name;
            
            // 确保商品名称长度一致
            if (name.length < maxNameLength) {
              paddedName = name.padEnd(maxNameLength, ' ');
            } else if (name.length > maxNameLength) {
              paddedName = name.substring(0, maxNameLength);
            }
            
            // 格式化商品名称和数量，使用"商品名称  X数量"格式
            printer.text(`${name}  X${quantity}`);
            
            // 打印规格信息
            if (item.specs && item.specs.text) {
              printer.text(`温度: ${item.specs.text}`);
            }
          });
          
          // 打印订单尾部信息
          printer
            .text('--------------------------------')
            .text('备注:')
            .text(order.remark || '无')
            .text('--------------------------------');
          
          // 打印时间
          const dateStr = new Date(order.created_at).toLocaleString('zh-CN');
          printer.text(`时间: ${dateStr}`);
          
          // 执行切纸并关闭连接
          printer
            .cut()
            .close();
          
          console.log('✓ ESC/POS打印流程完成');
        });
      } else {
        console.log('未找到USB打印机，尝试使用网络打印机');
        // 尝试使用网络打印机
        const device = new escpos.Network('localhost');
        const printer = new escpos.Printer(device);
        
        device.open(() => {
          console.log('✓ 网络打印机连接成功');
          
          // 初始化打印机
          printer
            .font('a')
            .align('ct')
            .style('bu')
            .size(1, 1)
            .text('ON TOP')
            .text('悦翔茶歇')
            .align('lt')
            .style('normal')
            .size(1, 0)
            // 调整行高为30点，恢复默认行高
            .setLineHeight(30)
            .text('--------------------------------');
          
          // 打印订单号
          printer
            .text(`订单号: ${order.order_no}`)
            .text('--------------------------------');
          
          // 打印商品明细标题
          printer
            .text('商品名称                  数量')
            .text('--------------------------------');

          
          // 打印商品明细
          const items = order.items || [];
          items.forEach((item: any) => {
            const name = item.name || '未知商品';
            const quantity = item.quantity || 1;
            
            // 使用简单可靠的对齐方式
            const maxNameLength = 12;
            let paddedName = name;
            
            // 确保商品名称长度一致
            if (name.length < maxNameLength) {
              paddedName = name.padEnd(maxNameLength, ' ');
            } else if (name.length > maxNameLength) {
              paddedName = name.substring(0, maxNameLength);
            }
            
            // 格式化商品名称和数量，确保数量对齐
            const quantityStr = `× ${quantity}`;
            printer.text(`${paddedName}        ${quantityStr}`);
            
            // 打印规格信息
            if (item.specs && item.specs.text) {
              printer.text(`温度: ${item.specs.text}`);
            }
          });
          
          // 打印订单尾部信息
          printer
            .text('--------------------------------')
            .text('备注:')
            .text(order.remark || '无')
            .text('--------------------------------');
          
          // 打印时间
          const dateStr = new Date(order.created_at).toLocaleString('zh-CN');
          printer.text(`时间: ${dateStr}`);
          
          // 执行切纸并关闭连接
          printer
            .cut()
            .close();
          
          console.log('✓ ESC/POS打印流程完成');
        });
      }
    } catch (error) {
      console.error('✗ ESC/POS打印过程中发生错误:', error);
      throw error;
    }
  }

  // 执行打印
  async printOrder(order: any, format: 'txt' = 'txt'): Promise<void> {
    try {
      console.log('开始执行订单打印...');
      console.log('打印格式:', format);
      
      // 生成打印内容
      const printContent = this.generatePrintContent(order);
      console.log('打印内容:', printContent);
      
      // 通过WebSocket推送打印任务到客户端
      try {
        this.orderGateway.notifyPrintOrder(order, printContent);
        console.log('✅ WebSocket打印任务推送成功');
        console.log('📡 打印任务已发送到所有连接的客户端');
        console.log('👥 客户端将负责执行实际的打印操作');
        console.log('🎯 分布式打印模式已启用');
      } catch (wsError: any) {
        console.error('❌ WebSocket打印任务推送失败:', wsError.message);
        console.error('⚠️  请检查WebSocket服务是否正常运行');
        console.error('⚠️  请检查客户端是否已连接');
      }
      
      // 服务器端不再执行本地打印
      // 所有打印操作由客户端负责
      console.log('✅ 服务器端打印任务分发完成');
    } catch (error) {
      console.error('打印过程中发生错误:', error);
    }
  }
}
