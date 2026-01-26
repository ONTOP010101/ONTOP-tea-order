import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SpecGroup } from './spec-group.entity';

@Entity('spec_items')
export class SpecItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  value: string;

  @Column({ length: 50, nullable: true, name: 'value_en' })
  valueEn: string;

  @Column({ length: 50, nullable: true, name: 'value_ar' })
  valueAr: string;

  @Column({ length: 50, nullable: true, name: 'value_es' })
  valueEs: string;

  @Column({ length: 50, nullable: true, name: 'value_pt' })
  valuePt: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ name: 'group_id' })
  groupId: number;

  @Column({ default: 0 })
  sort: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => SpecGroup, (group) => group.items)
  @JoinColumn({ name: 'group_id' })
  group: SpecGroup;
}
