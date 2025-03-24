import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class warehouse {
  @PrimaryColumn({ default: '' })
  id: string;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  quantity: string;

  @Column({ default: '' })
  pricePerUnit: string;
  
  @Column({ default: '' })
  inventory: string;

  @Column({ default: '' })
  comment: string;

  @Column({ nullable: false, default: '' })
  countryCode: string;

  @Column('json', { default: {} })
  serviceCategory: {
    serviceName: string;
    priceInEuroWithoutVAT: number;
  };
}