import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { SpecGroup } from '../../entities/spec-group.entity';
import { SpecItem } from '../../entities/spec-item.entity';
import { ProductSpecGroup } from '../../entities/product-spec-group.entity';

@Injectable()
export class SpecService {
  constructor(
    @InjectRepository(SpecGroup) private specGroupRepository: Repository<SpecGroup>,
    @InjectRepository(SpecItem) private specItemRepository: Repository<SpecItem>,
    @InjectRepository(ProductSpecGroup) private productSpecGroupRepository: Repository<ProductSpecGroup>,
  ) {}

  // 规格组管理
  async createSpecGroup(data: { name: string; name_en?: string; name_ar?: string; name_es?: string; name_pt?: string; isRequired: number; isMultiple: number; sort?: number }) {
    const { name_en, name_ar, name_es, name_pt, ...rest } = data;
    const specGroup = this.specGroupRepository.create({
      ...rest,
      nameEn: name_en,
      nameAr: name_ar,
      nameEs: name_es,
      namePt: name_pt
    });
    return await this.specGroupRepository.save(specGroup);
  }

  async updateSpecGroup(id: number, data: { name?: string; name_en?: string; name_ar?: string; name_es?: string; name_pt?: string; isRequired?: number; isMultiple?: number; sort?: number }) {
    const { name_en, name_ar, name_es, name_pt, ...rest } = data;
    const updateData = {
      ...rest,
      ...(name_en !== undefined && { nameEn: name_en }),
      ...(name_ar !== undefined && { nameAr: name_ar }),
      ...(name_es !== undefined && { nameEs: name_es }),
      ...(name_pt !== undefined && { namePt: name_pt })
    };
    await this.specGroupRepository.update(id, updateData);
    return this.getSpecGroupById(id);
  }

  async deleteSpecGroup(id: number) {
    // 先删除该规格组下的所有规格项
    await this.specItemRepository.delete({ groupId: id });
    // 再删除该规格组与商品的绑定关系
    await this.productSpecGroupRepository.delete({ groupId: id });
    // 最后删除规格组
    await this.specGroupRepository.delete(id);
    return { success: true };
  }

  async getSpecGroupById(id: number) {
    const specGroup = await this.specGroupRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!specGroup) {
      throw new NotFoundException('规格组不存在');
    }
    return specGroup;
  }

  async getAllSpecGroups() {
    return await this.specGroupRepository.find({
      relations: ['items'],
      order: { sort: 'ASC' },
    });
  }

  // 规格项管理
  async createSpecItem(groupId: number, data: { value: string; value_en?: string; value_ar?: string; value_es?: string; value_pt?: string; price?: number; sort?: number }) {
    const { value_en, value_ar, value_es, value_pt, ...rest } = data;
    const specItem = this.specItemRepository.create({
      ...rest,
      groupId,
      valueEn: value_en,
      valueAr: value_ar,
      valueEs: value_es,
      valuePt: value_pt
    });
    return await this.specItemRepository.save(specItem);
  }

  async updateSpecItem(id: number, data: { value?: string; value_en?: string; value_ar?: string; value_es?: string; value_pt?: string; price?: number; sort?: number }) {
    const { value_en, value_ar, value_es, value_pt, ...rest } = data;
    const updateData = {
      ...rest,
      ...(value_en !== undefined && { valueEn: value_en }),
      ...(value_ar !== undefined && { valueAr: value_ar }),
      ...(value_es !== undefined && { valueEs: value_es }),
      ...(value_pt !== undefined && { valuePt: value_pt })
    };
    await this.specItemRepository.update(id, updateData);
    return this.getSpecItemById(id);
  }

  async deleteSpecItem(id: number) {
    await this.specItemRepository.delete(id);
    return { success: true };
  }

  async getSpecItemById(id: number) {
    const specItem = await this.specItemRepository.findOne({
      where: { id },
      relations: ['group'],
    });
    if (!specItem) {
      throw new NotFoundException('规格项不存在');
    }
    return specItem;
  }

  // 商品-规格组绑定管理
  async bindSpecGroupToProduct(productId: number, groupId: number, sort?: number) {
    const productSpecGroup = this.productSpecGroupRepository.create({
      productId,
      groupId,
      sort: sort || 0,
    });
    return await this.productSpecGroupRepository.save(productSpecGroup);
  }

  async unbindSpecGroupFromProduct(productId: number, groupId: number) {
    await this.productSpecGroupRepository.delete({
      productId,
      groupId,
    });
    return { success: true };
  }

  async getSpecGroupsForProduct(productId: number) {
    const productSpecGroups = await this.productSpecGroupRepository.find({
      where: { productId },
      relations: ['group', 'group.items'],
      order: { sort: 'ASC' },
    });
    return productSpecGroups.map(psg => psg.group);
  }

  async updateSpecGroupSortForProduct(productId: number, groupId: number, sort: number) {
    await this.productSpecGroupRepository.update(
      { productId, groupId },
      { sort },
    );
    return { success: true };
  }

  // 获取所有未绑定到商品的规格组
  async getUnboundSpecGroupsForProduct(productId: number) {
    const boundGroupIds = (await this.productSpecGroupRepository.find({
      where: { productId },
      select: ['groupId'],
    })).map(psg => psg.groupId);

    return this.specGroupRepository.find({
      where: boundGroupIds.length > 0 ? { id: Not(In(boundGroupIds)) } : {},
      relations: ['items'],
      order: { sort: 'ASC' },
    });
  }

  // 验证规格选择是否符合要求
  async validateSpecSelection(productId: number, selections: { groupId: number; itemIds: number[] }[]) {
    const specGroups = await this.getSpecGroupsForProduct(productId);
    const errors: string[] = [];

    // 检查必选规格组是否都有选择
    for (const group of specGroups) {
      if (group.isRequired === 1) {
        const selection = selections.find(s => s.groupId === group.id);
        if (!selection || selection.itemIds.length === 0) {
          errors.push(`${group.name}是必选规格`);
        }
      }
    }

    // 检查单选规格组是否只选择了一个
    for (const selection of selections) {
      const group = specGroups.find(g => g.id === selection.groupId);
      if (group && group.isMultiple === 0 && selection.itemIds.length > 1) {
        errors.push(`${group.name}只能选择一个`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
