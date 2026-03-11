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

  @CreateDateColumn()
  changedAt: Date;
}

