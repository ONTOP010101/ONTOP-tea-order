import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('time_limited_products')
export class TimeLimitedProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id', nullable: false })
  product_id: number;

  @Column({ name: 'start_time', type: 'datetime', nullable: false })
  start_time: string;

  @Column({ name: 'end_time', type: 'datetime', nullable: false })
  end_time: string;

  @Column({ default: 0 })
  sort: number;

  @Column({ default: 0 })
  status: number; // 0: 未开始, 1: 进行中, 2: 已结束

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => Product, (product) => product.id)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}