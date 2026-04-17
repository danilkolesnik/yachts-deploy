import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class OrderTimerHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column({ nullable: true })
  timerId?: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  changedBy?: string;

  /** JSON: timerUserId, timerStatus, orderStatusSideEffect, etc. */
  @Column({ type: 'text', nullable: true })
  meta?: string;

  @CreateDateColumn()
  changedAt: Date;
}
