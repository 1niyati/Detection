import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @ManyToOne(() => User, { eager: true })
  user!: User;

  @Column()
  userId!: number;

  @OneToMany(() => ChatMessage, (message) => message.session)
  messages!: ChatMessage[];

  @CreateDateColumn()
  createdAt!: Date;
} 