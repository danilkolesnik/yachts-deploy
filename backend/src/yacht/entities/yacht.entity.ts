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

  @Column({ nullable: true })
  registrationNameOrType: string;

  @Column({ type: 'int', nullable: true })
  enginesCount: number;

  @Column({ type: 'int', nullable: true })
  engineHours: number;

  @Column({ type: 'text', nullable: true })
  description: string;
} 