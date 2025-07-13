import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User, 'default')
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {
    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers() {
    // Check if admin exists
    const adminExists = await this.userRepository.findOne({
      where: { email: 'admin@sentinelsoc.com' }
    });

    if (!adminExists) {
      // Add admin user
      const adminPassword = await bcrypt.hash('admin123', 10);
      const adminUser = this.userRepository.create({
        name: 'System Administrator',
        email: 'admin@sentinelsoc.com',
        password: adminPassword,
        role: 'admin',
        department: 'SENTINEL SOC Administration',
        isApproved: true,
        lastLogin: new Date(),
      });
      await this.userRepository.save(adminUser);
    }

    // Check if test analyst exists
    const analystExists = await this.userRepository.findOne({
      where: { email: 'Reteeac123@gmail.com' }
    });

    if (!analystExists) {
      // Add test analyst user
      const analystPassword = await bcrypt.hash('123456', 10);
      const testAnalyst = this.userRepository.create({
        name: 'Test Analyst',
        email: 'Reteeac123@gmail.com',
        password: analystPassword,
        role: 'analyst',
        department: 'Security Operations',
        isApproved: true,
      });
      await this.userRepository.save(testAnalyst);
    }

    // Log current users
    const allUsers = await this.userRepository.find();
    console.log('Current users in database:');
    console.table(allUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isApproved: user.isApproved,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    })));
  }

  async login({ email, password }: { email: string; password: string }) {
    console.log('\nLogin attempt for:', email);
    
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      console.log('❌ User not found:', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);
    console.log('✅ Login successful for:', email);

    const payload = { email: user.email, userId: user.id, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isApproved: user.isApproved,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        token: token, // Pass token within the user object
      }
    };
  }

  async signup({ name, email, password, role, department }: { 
    name: string;
    email: string;
    password: string;
    role: string;
    department: string;
  }) {
    console.log('\nSignup attempt:', { email, role, department });

    // Check if user exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      console.log('❌ Email already exists:', email);
      throw new UnauthorizedException('Email already exists');
    }

    // Don't allow creation of admin accounts through signup
    if (role === 'admin') {
      console.log('❌ Attempted to create admin account through signup');
      throw new UnauthorizedException('Cannot create admin accounts');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      role: role as 'analyst' | 'viewer',
      department,
      isApproved: true,
    });

    await this.userRepository.save(newUser);
    console.log('✅ New user created successfully');

    const payload = { email: newUser.email, userId: newUser.id, role: newUser.role };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        isApproved: newUser.isApproved,
        createdAt: newUser.createdAt,
        token: token, // Pass token within the user object
      }
    };
  }
} 