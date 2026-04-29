import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Yacht {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  model: string;

  @Column({ nullable: true })
  repairTime: string;

  @Column({ default: '' })
  countryCode: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ nullable: true })
  ownerContacts: string;

  @Column({ type: 'int', nullable: true })
  engineHours: number;

  @Column({ nullable: true })
  owner: string;

  @Column({ nullable: true })
  ownerEmail: string;

  @Column({ nullable: true })
  ownerPhone: string;

  @Column({ nullable: true })
  ownerAddress: string;

  @Column({ nullable: true })
  engineCount: string;

  // Stored as TEXT in Postgres via TypeORM "simple-json" (and works in sqlite too)
  @Column({ type: 'simple-json', nullable: true })
  engines: Array<{ model?: string; hours?: string | number }>;

  @Column({ nullable: true })
  hasGenerators: string;

  @Column({ nullable: true })
  generatorCount: string;

  @Column({ type: 'simple-json', nullable: true })
  generators: Array<{ model?: string; hours?: string | number }>;

  @Column({ nullable: true })
  hasAirConditioners: string;

  @Column({ nullable: true })
  airConditionerCount: string;

  @Column({ type: 'simple-json', nullable: true })
  airConditioners: Array<{ model?: string; hours?: string | number }>;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: '' })
  userId: string;

  @Column({ default: '' })
  userName: string;
} 