import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { ChatSession } from '../chat/entities/chat-session.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,  // PostgreSQL default port
  username: 'postgres', // Replace with your PostgreSQL username if different
  password: 'abc', // Replace with your PostgreSQL password
  database: 'Chatbot',
  entities: [User, ChatSession, ChatMessage],
  synchronize: true, // Set to false in production
  logging: true,
}; 