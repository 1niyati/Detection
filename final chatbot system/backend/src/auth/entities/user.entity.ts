import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'analyst', 'viewer'],
    default: 'analyst'
  })
  role!: 'admin' | 'analyst' | 'viewer';

  @Column()
  department!: string;

  @Column({ default: true })
  isApproved: boolean = true;

  @Column({ nullable: true, type: 'timestamp' })
  lastLogin?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 