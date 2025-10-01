import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class offer {
  @PrimaryColumn()
  id: string;

  @Column({default: ''})
  customerId: string;

  @Column({default: ''})
  customerFullName: string;

  @Column({default: ''})
  yachtName: string;

  @Column({default: ''})
  yachtModel: string;

  @Column({ default: '' })
  comment: string;

  @Column({default: ''})
  countryCode: string;

  @Column('json', { default: [] })
  services: { serviceName: string; priceInEuroWithoutVAT: number }[];

  @Column('json', { default: [] })
  parts: { partName: string; quantity: number }[];

  @Column({ default: 'created' })
  status: string;

  @Column('json', { default: [] })
  versions: any[];

  @Column('json', { nullable: true, default: [] })
  imageUrls: string[];

  @Column('json', { nullable: true, default: [] })
  videoUrls: string[];

  @Column({ default: 'en' })
  language: string;

  @CreateDateColumn()
  createdAt: Date;
}