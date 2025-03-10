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

  @CreateDateColumn()
  createdAt: Date;
}