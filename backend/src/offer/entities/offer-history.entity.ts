import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class OfferHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  offerId: string;

  @Column()
  userId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  changeDate: Date;

  @Column({ type: 'text', default: '' })
  changeDescription: string;

  @CreateDateColumn()
  createdAt: Date;
}