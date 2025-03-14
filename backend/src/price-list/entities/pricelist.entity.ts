import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Pricelist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '' })
  serviceName: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  priceInEuroWithoutVAT: number;

  @Column({ default: '' })
  unitsOfMeasurement: string;

  @Column({ default: '' })
  description: string;
}