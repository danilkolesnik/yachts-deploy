import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class UserAuditHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  changedBy?: string;

  // 'user' | 'employee_profile' | 'client_request'
  @Column()
  entityType: string;

  @Column('text')
  changeDescription: string;

  @CreateDateColumn()
  createdAt: Date;
}

