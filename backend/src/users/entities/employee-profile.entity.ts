import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class EmployeeProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ default: '' })
  fullName: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: string;

  @Column({ default: '' })
  phone: string;

  @Column({ default: '' })
  secondaryPhone: string;

  @Column({ default: '' })
  address: string;

  @Column({ type: 'date', nullable: true })
  contractStart?: string;

  @Column({ type: 'date', nullable: true })
  contractEnd?: string;

  @Column({ default: '' })
  position: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column('simple-array', { nullable: true })
  responsibilityAreas?: string[];

  @Column('simple-array', { nullable: true })
  permissions?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

