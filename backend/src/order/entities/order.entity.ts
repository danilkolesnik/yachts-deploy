import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, CreateDateColumn } from 'typeorm';
import { users } from 'src/auth/entities/users.entity';

@Entity()
export class order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  offerId: string;

  @ManyToMany(() => users)
  @JoinTable()
  assignedWorkers: users[];

  @Column({ default: '' })
  customerId: string;

  @Column({ default: 'created' }) // created, in_progress, paused, finished, completed
  status: string;

  /**
   * Snapshot of offer items at the moment the order is created.
   * These are editable on the order without mutating the original offer.
   */
  @Column('json', { default: [] })
  services: any[];

  @Column('json', { default: [] })
  parts: any[];

  @Column('simple-array', { nullable: true })
  processImageUrls: string[];

  @Column('simple-array', { nullable: true })
  processVideoUrls: string[];

  @Column('simple-array', { nullable: true })
  resultImageUrls: string[];

  @Column('simple-array', { nullable: true })
  resultVideoUrls: string[];

  @Column('simple-array', { nullable: true })
  tabImageUrls: string[];

  @Column('simple-array', { nullable: true })
  tabVideoUrls: string[];

  @CreateDateColumn()
  createdAt: Date;

  /** User id who created the work order (ZN) */
  @Column({ nullable: true })
  createdBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}