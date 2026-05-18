import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class OrderAssignmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column('simple-array', { nullable: true })
  oldWorkerIds: string[];

  @Column('simple-array')
  newWorkerIds: string[];

  @Column({ nullable: true })
  changedBy?: string;

  /** Required when assigned workers are changed after initial assignment */
  @Column({ type: 'text', nullable: true })
  changeReason?: string;

  @CreateDateColumn()
  changedAt: Date;
}

