// @ts-nocheck
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SocUser } from './soc-user.entity';

@Entity('login_activity')
export class LoginActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => SocUser, user => user.loginActivities)
  @JoinColumn({ name: 'user_id' })
  user: SocUser;

  @Column()
  email: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ name: 'ip_address' })
  ipAddress: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  asn: number;

  @Column({ name: 'user_agent' })
  userAgent: string;

  @Column({ name: 'device_type' })
  deviceType: string;

  @Column()
  browser: string;

  @Column({ name: 'operating_system' })
  operatingSystem: string;

  @Column({ name: 'login_frequency' })
  loginFrequency: number;

  @Column({ name: 'login_successful' })
  loginSuccessful: boolean;

  @Column()
  status: string;

  @Column({ name: 'is_anomaly' })
  isAnomaly: boolean;

  @Column({ type: 'float', name: 'anomaly_score' })
  anomalyScore: number;

  @Column({ name: 'anomaly_reason' })
  anomalyReason: string;

  @Column()
  severity: string;
} 