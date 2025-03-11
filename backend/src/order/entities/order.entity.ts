import { Entity, Column, PrimaryGeneratedColumn,ManyToMany, JoinTable, CreateDateColumn } from 'typeorm';
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

  @Column({ default: 'Created' })
  status: string;

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
}