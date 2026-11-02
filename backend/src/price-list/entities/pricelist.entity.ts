import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Pricelist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '' })
  serviceName: string;

  /** Croatian catalog title; empty falls back to serviceName (EN). */
  @Column({ default: '' })
  serviceNameHr: string;

  /** Synesis / internal price-list service code (шифр). */
  @Column({ default: '' })
  serviceCode: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  priceInEuroWithoutVAT: number;

  @Column({ default: '' })
  unitsOfMeasurement: string;

  @Column({ default: '' })
  description: string;
}