import { Role } from 'src/constants/roles';
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class users {
  @PrimaryColumn()
  id: string;

  @Column({ default: Role.USER })
  role: string;

  @Column()
  email: string;

  @Column({ default: '' })
  fullName: string

  @Column()
  password: string;
}
