import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { UserRole } from '../auth/enums/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginActivity } from '../soc/entities/login-activity.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User, 'default')
    private readonly userRepository: Repository<User>,
    @InjectRepository(ChatMessage, 'default')
    private readonly messageRepository: Repository<ChatMessage>,
    @InjectRepository(LoginActivity, 'applicationConnection')
    private readonly loginActivityRepository: Repository<LoginActivity>,
  ) {}

  async getSocStats(date?: string) {
    let startDate: Date;
    let endDate: Date;

    if (date) {
      startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);
    } else {
      endDate = new Date();
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    }

    const recentActivities = await this.loginActivityRepository.find({
      where: { timestamp: Between(startDate, endDate) },
    });

    const highRiskEvents = recentActivities.filter(
      a => a.severity === 'High' || a.severity === 'Critical'
    ).length;

    const activeSessions = new Set(
      recentActivities.filter(a => a.loginSuccessful).map(a => a.userId)
    ).size;

    const alertsPending = await this.loginActivityRepository.count({
        where: { isAnomaly: true, status: 'new', timestamp: Between(startDate, endDate) }
    });

    return {
      loginAttempts24h: recentActivities.length,
      highRiskEvents,
      activeSessions,
      alertsPending,
    };
  }

  async getRecentActivities() {
    const activities = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.session', 'session')
      .leftJoinAndSelect('session.user', 'user')
      .where('user.role = :role', { role: UserRole.Analyst })
      .andWhere("message.role = 'user'")
      .orderBy('message.createdAt', 'DESC')
      .limit(10)
      .getMany();

    return activities.map((activity) => ({
      user: activity.session?.user?.name ?? 'Unknown',
      action: activity.content,
      time: activity.createdAt,
      type: 'analyst_query',
    }));
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'name', 'email', 'role', 'isApproved', 'lastLogin'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async createUser(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { email, name, password, role } = createUserDto;
    const existingUser = await this.userRepository.findOne({ where: { email } });

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
      isApproved: true, // New users created by an admin are approved by default
    });

    const savedUser = await this.userRepository.save(newUser);
    const { password: _, ...result } = savedUser;
    return result;
  }

  async getDashboardStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { isApproved: true } });
    const pendingUsers = await this.userRepository.count({ where: { isApproved: false } });
    
    // Note: The 'suspended' status is not in the User entity.
    // This will require a schema change or be hardcoded as 0.
    const suspendedUsers = 0; 

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
    };
  }
} 