import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/** Worker remark on a work order (material issue, replacement, missing item, etc.). */
@Entity()
export class OrderWorkerNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  userId: string;

  /** not_fit | replace | missing | other */
  @Column({ default: 'other' })
  category: string;

  @Column('text')
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}
