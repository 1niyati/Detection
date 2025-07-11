import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { HttpModule } from '@nestjs/axios';
import { ChatMessage } from '../chat/entities/chat-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ChatMessage]), HttpModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {} 