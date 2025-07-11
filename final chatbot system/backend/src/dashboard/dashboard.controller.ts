import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('alerts')
  getAlerts() {
    return this.dashboardService.getAlerts();
  }

  @Get('login-activity')
  getLoginActivity() {
    return this.dashboardService.getLoginActivity();
  }
  
  @Get('user-roles')
  getUserRoleDistribution() {
    return this.dashboardService.getUserRoleDistribution();
  }

  @Get('recent-activity')
  getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }

  @Get('all-users')
  getAllUsers() {
    return this.dashboardService.getAllUsers();
  }
}
