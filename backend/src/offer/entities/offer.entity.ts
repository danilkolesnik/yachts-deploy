import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  price: number;

  @Column()
  customerId: string;

  @Column()
  customerFullName: string;

  @Column()
  yachtName: string;

  @Column()
  yachtModel: string;

  @Column('simple-array', { nullable: true })
  imageUrls: string[];

  @Column('simple-array', { nullable: true })
  videoUrls: string[];

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}