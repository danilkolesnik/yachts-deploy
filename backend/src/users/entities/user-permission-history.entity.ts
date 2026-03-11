import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class UserPermissionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  changedBy?: string;

  @Column({ nullable: true })
  oldRole?: string;

  @Column({ nullable: true })
  newRole?: string;

  @Column('simple-array', { nullable: true })
  oldPermissions?: string[];

  @Column('simple-array', { nullable: true })
  newPermissions?: string[];

  @Column('simple-array', { nullable: true })
  oldResponsibilityAreas?: string[];

  @Column('simple-array', { nullable: true })
  newResponsibilityAreas?: string[];

  @CreateDateColumn()
  changedAt: Date;
}

