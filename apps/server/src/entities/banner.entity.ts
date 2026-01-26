import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  image: string; // Banner图片URL

  @Column({ length: 100, nullable: false })
  title: string; // Banner标题

  @Column({ length: 255, nullable: true })
  link: string; // Banner链接（可选）

  @Column({ type: 'int', default: 0 })
  sort: number; // 排序，数字越小越靠前

  @Column({ type: 'boolean', default: true })
  is_active: boolean; // 是否启用

  @Column({ type: 'timestamp', nullable: true })
  start_time: Date; // 开始时间（可选）

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date; // 结束时间（可选）

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}