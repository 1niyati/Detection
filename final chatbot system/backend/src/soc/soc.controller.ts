import { Controller, Get, Query } from '@nestjs/common';
import { SocService } from './soc.service';

@Controller('soc')
export class SocController {
  constructor(private readonly socService: SocService) {}

  @Get('metrics')
  getMetrics(@Query('date') date?: string) {
    return this.socService.getDashboardMetrics(date);
  }

  @Get('alerts')
  getAlerts(@Query('date') date?: string) {
    return this.socService.getSecurityAlerts(date);
  }

  @Get('login-attempts')
  getLoginAttempts(@Query('date') date?: string) {
    return this.socService.getLoginAttempts(date);
  }

  @Get('suspicious-summary')
  getSuspiciousSummary(@Query('timeWindow') timeWindow?: string) {
    return this.socService.getSuspiciousSummary(timeWindow);
  }
}
