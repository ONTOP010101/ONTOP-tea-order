import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { OrderGateway } from '../websocket/order.gateway';
import { ProductService } from '../product/product.service';
import { SpecService } from '../spec/spec.service';
import { UserService } from '../user/user.service';
import dayjs from 'dayjs';

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
      
      // 处理商品信息，强制使用中文名称和中文规格
      const processedItems = await Promise.all(data.items.map(async (item: any) => {
        // 根据商品ID获取完整商品信息
        const product = await this.productService.findOne(parseInt(item.productId));
        console.log('商品信息:', product);
        
        if (!product) {
          throw new Error(`商品不存在: ${item.productId}`);
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

      // WebSocket实时推送新订单 - 添加try-catch防止WebSocket错误影响订单创建
      try {
        console.log('🔔 准备推送新订单到WebSocket:', savedOrder.order_no);
        this.orderGateway.notifyNewOrder(savedOrder);
        console.log('✅ WebSocket推送成功');
      } catch (wsError: any) {
        console.error('❌ WebSocket推送失败:', wsError.message, wsError.stack);
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
    await this.orderRepository.update(id, { status });
    const order = await this.findOne(id);
    
    // WebSocket推送订单状态变更
    this.orderGateway.notifyOrderStatusChange(order);
    
    return order;
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
        'order.status'
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
    
    return this.updateStatus(id, 'cancelled');
  }

  // 管理端查询所有订单，支持按session_id筛选
  async findAll(params: any) {
    const { page = 1, pageSize = 20, status, sessionId } = params;
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

    // 添加时间过滤，只返回48小时内的订单
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() - 48);
    query.andWhere('order.created_at >= :expirationTime', { expirationTime });

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

  // 清理过期订单（超过48小时）
  async clearExpiredOrders(): Promise<void> {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() - 48);
    
    await this.orderRepository.createQueryBuilder()
      .delete()
      .from(Order)
      .where('created_at < :expirationTime', { expirationTime })
      .execute();
  }
}
