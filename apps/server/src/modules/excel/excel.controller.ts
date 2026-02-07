import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import * as XLSX from 'xlsx';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Excel导入')
@Controller('excel')
export class ExcelController {
  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
  ) {}

  @Post('import/products')
  @ApiOperation({ summary: '导入商品Excel文件' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'temp');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const randomName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${randomName}${ext}`);
        },
      }),
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB限制
      },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname);
        if (!['.xlsx', '.xls'].includes(ext)) {
          return cb(new BadRequestException('只能上传Excel文件'), false);
        }
        cb(null, true);
      },
    }),
  )
  async importProducts(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      // 读取Excel文件
      const workbook = XLSX.readFile(file.path);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // 转换为JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        throw new BadRequestException('Excel文件中没有数据');
      }

      // 加载所有分类，构建映射
      const categories = await this.categoryService.findAll();
      const categoryMap: Record<string, number> = {};
      categories.forEach((cat: any) => {
        categoryMap[cat.name.toLowerCase()] = cat.id;
      });

      // 处理Excel中的图片
      const extractImagesFromExcel = (workbook: any, rowIndex: number): string => {
        try {
          // 检查workbook是否有图片
          if (workbook.Props && workbook.Sheets && workbook.Sheets[firstSheetName]) {
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 检查是否有图片数据
            if (worksheet['!images']) {
              const images = worksheet['!images'];
              
              // 查找对应行的图片
              for (const img of images) {
                if (img && img.range && img.range.s && img.range.s.r === rowIndex) {
                  // 这里需要实现图片的提取和保存
                  // 由于xlsx库对图片的支持有限，实际实现可能需要使用其他库
                  // 暂时返回一个占位符
                  return `/uploads/placeholder-${Date.now()}.jpg`;
                }
              }
            }
          }
          return '';
        } catch (error) {
          console.error('提取图片失败:', error);
          return '';
        }
      };

      // 批量处理商品
      const productsToCreate = [];
      
      for (let i = 0; i < jsonData.length; i++) {
        const product = jsonData[i] as any;
        
        try {
          // 检查商品名称
          const productName = product.name || product.商品名称 || '';
          if (!productName) {
            errorCount++;
            errors.push(`第${i + 2}行: 商品名称不能为空`);
            continue;
          }

          // 获取分类ID
          let categoryId = 1; // 默认分类
          const categoryName = product.category || product.分类 || '';
          if (categoryName) {
            const lowerCategoryName = categoryName.toLowerCase();
            if (categoryMap[lowerCategoryName]) {
              categoryId = categoryMap[lowerCategoryName];
            }
          }

          // 获取图片路径
          let imagePath = product.image || product.图片 || '';
          
          // 如果没有图片路径，尝试从Excel中提取图片
          if (!imagePath) {
            imagePath = extractImagesFromExcel(workbook, i);
          }

          // 构建商品数据
          const productData = {
            name: productName,
            name_en: product.name_en || product.英文名 || '',
            name_ar: product.name_ar || product.阿拉伯语 || '',
            name_es: product.name_es || product.西班牙语 || '',
            name_pt: product.name_pt || product.葡萄牙语 || '',
            price: parseFloat(product.price || product.价格 || '0'),
            category_id: categoryId,
            description: product.description || product.描述 || '',
            description_en: product.description_en || product.英文描述 || '',
            description_ar: product.description_ar || product.阿拉伯语描述 || '',
            description_es: product.description_es || product.西班牙语描述 || '',
            description_pt: product.description_pt || product.葡萄牙语描述 || '',
            image: imagePath,
            stock: parseInt(product.stock || product.库存 || '0'),
            status: 1
          };

          productsToCreate.push(productData);
        } catch (error) {
          errorCount++;
          errors.push(`第${i + 2}行: ${error.message}`);
        }
      }

      // 批量创建商品
      if (productsToCreate.length > 0) {
        const createdProducts = await this.productService.batchCreate(productsToCreate);
        successCount = createdProducts.length;
      }

      return {
        code: HttpStatus.OK,
        message: '导入完成',
        data: {
          successCount,
          errorCount,
          totalCount: jsonData.length,
          errors
        }
      };
    } catch (error) {
      throw new BadRequestException(`导入失败: ${error.message}`);
    } finally {
      // 清理临时文件
      if (existsSync(file.path)) {
        try {
          unlinkSync(file.path);
        } catch (error) {
          console.error('清理临时文件失败:', error);
        }
      }
    }
  }

  @Post('import/categories')
  @ApiOperation({ summary: '导入分类Excel文件' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'temp');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const randomName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${randomName}${ext}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB限制
      },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname);
        if (!['.xlsx', '.xls'].includes(ext)) {
          return cb(new BadRequestException('只能上传Excel文件'), false);
        }
        cb(null, true);
      },
    }),
  )
  async importCategories(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      // 读取Excel文件
      const workbook = XLSX.readFile(file.path);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // 转换为JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        throw new BadRequestException('Excel文件中没有数据');
      }

      // 批量处理分类
      for (let i = 0; i < jsonData.length; i++) {
        const category = jsonData[i] as any;
        
        try {
          // 检查分类名称
          const categoryName = category.category || category.分类名称 || category.name || category.分类 || '';
          if (!categoryName) {
            errorCount++;
            errors.push(`第${i + 2}行: 分类名称不能为空`);
            continue;
          }

          // 构建分类数据
          const categoryData = {
            name: categoryName,
            icon: category.image || category.图片 || '',
            sort: category.sort || 0
          };

          // 创建分类
          await this.categoryService.create(categoryData);
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`第${i + 2}行: ${error.message}`);
        }
      }

      return {
        code: HttpStatus.OK,
        message: '导入完成',
        data: {
          successCount,
          errorCount,
          totalCount: jsonData.length,
          errors
        }
      };
    } catch (error) {
      throw new BadRequestException(`导入失败: ${error.message}`);
    } finally {
      // 清理临时文件
      if (existsSync(file.path)) {
        try {
          unlinkSync(file.path);
        } catch (error) {
          console.error('清理临时文件失败:', error);
        }
      }
    }
  }
}
