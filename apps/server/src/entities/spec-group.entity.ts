import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SpecItem } from './spec-item.entity';

@Entity('spec_groups')
export class SpecGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50, nullable: true, name: 'name_en' })
  nameEn: string;

  @Column({ length: 50, nullable: true, name: 'name_ar' })
  nameAr: string;

  @Column({ length: 50, nullable: true, name: 'name_es' })
  nameEs: string;

  @Column({ length: 50, nullable: true, name: 'name_pt' })
  namePt: string;

  @Column({ type: 'tinyint', name: 'is_required', default: 1 })
  isRequired: number;

  @Column({ type: 'tinyint', name: 'is_multiple', default: 0 })
  isMultiple: number;

  @Column({ default: 0 })
  sort: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SpecItem, (item) => item.group)
  items: SpecItem[];
}
