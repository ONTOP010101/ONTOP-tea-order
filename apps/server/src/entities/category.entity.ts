import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50, nullable: true })
  name_en: string;

  @Column({ length: 50, nullable: true })
  name_ar: string;

  @Column({ length: 50, nullable: true })
  name_es: string;

  @Column({ length: 50, nullable: true })
  name_pt: string;

  @Column({ nullable: true, length: 255 })
  icon: string;

  @Column({ default: 0 })
  sort: number;

  @Column({ name: 'parent_id', default: 0 })
  parent_id: number;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
