import { Controller, Get, Param, UseGuards, ParseUUIDPipe, Post, Body, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @Post('users')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  @Get('dashboard-stats')
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('soc-stats')
  getSocStats(@Query('date') date?: string) {
    return this.adminService.getSocStats(date);
  }

  @Get('activities')
  async getRecentActivities() {
    return this.adminService.getRecentActivities();
  }

  @Get('users/:id')
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserById(id);
  }
} 