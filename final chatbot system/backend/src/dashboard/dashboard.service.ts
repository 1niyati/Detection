import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ChatMessage } from '../chat/entities/chat-message.entity';

// A simple in-memory cache to avoid hammering the alerts endpoint
const alertCache = {
  data: null,
  timestamp: 0,
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    private readonly httpService: HttpService,
  ) {}

  async getStats() {
    const totalUsers = await this.userRepository.count();
    const userRoles = await this.userRepository.query(
      'SELECT role, COUNT(id) as count FROM users GROUP BY role',
    );
    
    const alerts = await this.getAlerts();
    const suspiciousActivities = alerts.length;

    return {
      totalUsers,
      userRoles,
      suspiciousActivities,
    };
  }

  async getAlerts() {
    const cacheDuration = 30000; // 30 seconds
    const now = Date.now();

    if (alertCache.data && now - alertCache.timestamp < cacheDuration) {
      return alertCache.data;
    }
    
    try {
      const response = await firstValueFrom(
        this.httpService.get('http://localhost:8000/auth/alerts/suspicious-logins'),
      );
      alertCache.data = response.data;
      alertCache.timestamp = now;
      return response.data;
    } catch (error) {
      console.error('Failed to fetch alerts from FastAPI service', error);
      return []; // Return empty array on failure
    }
  }

  async getLoginActivity() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logins = await this.userRepository.find({
      where: { lastLogin: MoreThan(sevenDaysAgo) },
      select: ['lastLogin'],
    });

    // Process data for chart
    const activity = logins.reduce((acc, user) => {
      if (user.lastLogin) {
        const day = user.lastLogin.toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(activity).map(([date, count]) => ({ date, count }));
  }
  
  async getUserRoleDistribution() {
    return this.userRepository.query(
        'SELECT role, COUNT(id)::int as count FROM users GROUP BY role ORDER BY role',
    );
  }

  async getRecentActivity() {
    // Get the last 10 user messages, along with user info
    return this.messageRepository.find({
      where: { role: 'user' },
      relations: ['session', 'session.user'],
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async getAllUsers() {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
      select: ['id', 'name', 'email', 'role', 'lastLogin', 'createdAt'], // Explicitly select columns to avoid sending password
    });
  }
}
