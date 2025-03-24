// src/order/entities/order-timer.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class OrderTimer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column({ default: '' })
  userId: string;

  @CreateDateColumn()
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ default: true })
  isRunning: boolean;

  @Column({ default: false })
  isPaused: boolean;

  @Column({ type: 'timestamp', nullable: true })
  pauseTime: Date;

  @Column({ nullable: true, type: 'bigint' })
  totalPausedTime: number;

  @Column({ nullable: true, type: 'bigint' })
  totalDuration: number;

  @Column({ default: 'In Progress' })
  status: string;
}