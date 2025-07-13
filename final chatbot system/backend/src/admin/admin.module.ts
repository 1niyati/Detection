import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { LoginActivity } from '../soc/entities/login-activity.entity';
import { SocUser } from '../soc/entities/soc-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ChatMessage], 'default'),
    TypeOrmModule.forFeature([LoginActivity, SocUser], 'applicationConnection'),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {} 