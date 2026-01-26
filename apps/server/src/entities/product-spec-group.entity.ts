import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';
import { SpecGroup } from './spec-group.entity';

@Entity('product_spec_groups')
@Unique(['productId', 'groupId'])
export class ProductSpecGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ name: 'group_id' })
  groupId: number;

  @Column({ default: 0 })
  sort: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => SpecGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: SpecGroup;
}
