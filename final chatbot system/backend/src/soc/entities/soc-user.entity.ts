// @ts-nocheck
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { LoginActivity } from './login-activity.entity';

@Entity('users')
export class SocUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'hashed_password', select: false })
  hashed_password: string;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @OneToMany(() => LoginActivity, loginActivity => loginActivity.user)
  loginActivities: LoginActivity[];
} 