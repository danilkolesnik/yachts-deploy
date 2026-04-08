import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class OrderClientMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  userId: string;

  // 'additional_work' | 'comment'
  @Column({ default: 'comment' })
  kind: string;

  @Column('text')
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}

