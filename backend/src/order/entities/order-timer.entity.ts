// src/order/entities/order-timer.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class OrderTimer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  /** 0-based index into order.services (or offer.services snapshot); null = legacy single timer per order */
  @Column({ type: 'int', nullable: true })
  serviceLineIndex: number | null;

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
  pauseTime: Date | null;

  @Column({ nullable: true, type: 'bigint' })
  totalPausedTime: number;

  @Column({ nullable: true, type: 'bigint' })
  totalDuration: number;

  @Column({ default: 'In Progress' })
  status: string;

  /** Start of current active-work segment (after start or last resume); used for per-segment duration in audit */
  @Column({ type: 'timestamp', nullable: true })
  segmentStartedAt: Date | null;
}