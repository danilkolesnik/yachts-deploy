import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class OfferHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  offerId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  changeDate: Date;

  @Column({ default: '' })
  changeDescription: string;
}