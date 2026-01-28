import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { TranslationService } from '../../translation/translation.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private translationService: TranslationService,
  ) {}

  private async findNextAvailableId(): Promise<number> {
    const categories = await this.categoryRepository.find({ select: ['id'] });
    const ids = categories.map(category => category.id).sort((a, b) => a - b);
    for (let i = 1; i <= ids.length + 1; i++) {
      if (!ids.includes(i)) return i;
    }
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  async findAll() {
    return await this.categoryRepository.find({
      order: { sort: 'DESC', created_at: 'ASC' },
    });
  }

  async findOne(id: string) {
    return await this.categoryRepository.findOne({ where: { id: parseInt(id) } });
  }

  async create(data: Partial<Category>) {
    // 如果提供了name字段，自动生成多语言翻译（如果没有提供的话，包括空字符串）
    if (data.name) {
      const translations = await this.translationService.translateText(data.name);
      // 只有当name_en为空字符串或undefined时，才使用自动翻译
      data.name_en = (data.name_en === '' || data.name_en === undefined) ? translations.en : data.name_en;
      data.name_ar = (data.name_ar === '' || data.name_ar === undefined) ? translations.ar : data.name_ar;
      data.name_es = (data.name_es === '' || data.name_es === undefined) ? translations.es : data.name_es;
      data.name_pt = (data.name_pt === '' || data.name_pt === undefined) ? translations.pt : data.name_pt;
    }
    const nextId = await this.findNextAvailableId();
    const category = this.categoryRepository.create({
      ...data,
      id: nextId,
    });
    return await this.categoryRepository.save(category);
  }

  async batchCreate(categories: Partial<Category>[]) {
    const createdCategories = [];
    for (const categoryData of categories) {
      try {
        const nextId = await this.findNextAvailableId();
        // 如果提供了name字段，自动生成多语言翻译（如果没有提供的话，包括空字符串）
        if (categoryData.name) {
          const translations = await this.translationService.translateText(categoryData.name);
          // 只有当name_en为空字符串或undefined时，才使用自动翻译
          categoryData.name_en = (categoryData.name_en === '' || categoryData.name_en === undefined) ? translations.en : categoryData.name_en;
          categoryData.name_ar = (categoryData.name_ar === '' || categoryData.name_ar === undefined) ? translations.ar : categoryData.name_ar;
          categoryData.name_es = (categoryData.name_es === '' || categoryData.name_es === undefined) ? translations.es : categoryData.name_es;
          categoryData.name_pt = (categoryData.name_pt === '' || categoryData.name_pt === undefined) ? translations.pt : categoryData.name_pt;
        }
        const category = this.categoryRepository.create({
          ...categoryData,
          id: nextId,
        });
        const savedCategory = await this.categoryRepository.save(category);
        createdCategories.push(savedCategory);
      } catch (error) {
      }
    }
    return createdCategories;
  }

  async update(id: string, data: Partial<Category>) {
    // 如果更新了name字段，自动更新多语言翻译（如果没有提供的话，包括空字符串）
    if (data.name) {
      const translations = await this.translationService.translateText(data.name);
      // 只有当name_en为空字符串或undefined时，才使用自动翻译
      data.name_en = (data.name_en === '' || data.name_en === undefined) ? translations.en : data.name_en;
      data.name_ar = (data.name_ar === '' || data.name_ar === undefined) ? translations.ar : data.name_ar;
      data.name_es = (data.name_es === '' || data.name_es === undefined) ? translations.es : data.name_es;
      data.name_pt = (data.name_pt === '' || data.name_pt === undefined) ? translations.pt : data.name_pt;
    }
    await this.categoryRepository.update(parseInt(id), data);
    return await this.findOne(id);
  }

  async delete(id: string) {
    await this.categoryRepository.delete(parseInt(id));
    return true;
  }
}
