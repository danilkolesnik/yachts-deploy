import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Invoice {
  @PrimaryColumn()
  id: string;

  @Column()
  offerId: string;

  @Column({ nullable: true, default: '' })
  orderId: string;

  @Column()
  invoiceNumber: string;

  @Column({ default: '' })
  customerId: string;

  @Column({ default: '' })
  customerFullName: string;

  @Column({ default: '' })
  yachtName: string;

  @Column({ default: '' })
  yachtModel: string;

  @Column({ default: '' })
  countryCode: string;

  @Column({ default: '' })
  location: string;

  @Column('json', { default: [] })
  parts: any[];

  @Column('json', { default: [] })
  services: any[];

  @Column({ default: 'en' })
  language: string;

  @Column({ type: 'float', default: 0 })
  subtotalWithoutTax: number;

  @Column({ type: 'float', default: 0 })
  taxAmount: number;

  @Column({ type: 'float', default: 0 })
  totalWithTax: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paymentDueAt?: Date;
}
