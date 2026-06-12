import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class offer {
  @PrimaryColumn()
  id: string;

  @Column({ default: '' })
  customerId: string;

  @Column({ default: '' })
  customerFullName: string;

  @Column({ default: '' })
  yachtName: string;

  @Column({ default: '' })
  yachtModel: string;

  @Column({ default: '' })
  location: string;

  @Column({ default: '' })
  comment: string;

  @Column({ default: '' })
  countryCode: string;

  @Column('json', { default: [] })
  yachts: { id: string; name: string; model: string; countryCode: string; userId: string; userName: string }[];

  @Column('json', { default: [] })
  services: {
    serviceName: string;
    priceInEuroWithoutVAT: number;
    quantity?: number;
    unitsOfMeasurement?: string;
  }[];

  @Column('json', { default: [] })
  parts: { partName: string; quantity: number }[];

  @Column({ default: 'created' })
  status: string; // created, confirmed, finished, closed

  @Column('json', { default: [] })
  versions: any[];

  @Column('json', { nullable: true, default: [] })
  imageUrls: string[];

  @Column('json', { nullable: true, default: [] })
  videoUrls: string[];

  @Column({ default: 'en' })
  language: string;

  /** Discount in EUR applied before VAT (rabat). */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt?: Date;

  @Column({ nullable: true })
  closedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt?: Date;
}