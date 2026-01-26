import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  name_en: string;

  @Column({ length: 100, nullable: true })
  name_ar: string;

  @Column({ length: 100, nullable: true })
  name_es: string;

  @Column({ length: 100, nullable: true })
  name_pt: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  description_en: string;

  @Column({ type: 'text', nullable: true })
  description_ar: string;

  @Column({ type: 'text', nullable: true })
  description_es: string;

  @Column({ type: 'text', nullable: true })
  description_pt: string;

  @Column({ name: 'category_id' })
  category_id: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ length: 255, nullable: true })
  image: string;

  @Column({ type: 'json', nullable: true })
  images: string[] | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @Column({ default: 0 })
  sort: number;

  @Column({ default: 0 })
  sales: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
