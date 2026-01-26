import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_no', unique: true, length: 50 })
  order_no: string;

  @Column({ name: 'user_id' })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'session_id', length: 100, nullable: true })
  session_id: string;

  @Column({ type: 'text' })
  items: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ name: 'final_amount', type: 'decimal', precision: 10, scale: 2 })
  final_amount: number;

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'preparing', 'making', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  })
  status: 'pending' | 'preparing' | 'making' | 'ready' | 'completed' | 'cancelled';

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ name: 'coupon_id', nullable: true })
  coupon_id: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
