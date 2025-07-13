import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between } from 'typeorm';
import { LoginActivity } from './entities/login-activity.entity';

// Interfaces adapted from frontend for data structures
interface LoginAttempt {
  id: string;
  timestamp: Date;
  userId: string;
  username: string;
  email: string;
  ipAddress: string;
  country: string;
  city: string;
  device: string;
  browser: string;
  userAgent: string;
  success: boolean;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  riskScore: number;
  anomalyReasons: string[];
  sessionId?: string;
  isNewDevice: boolean;
  isNewLocation: boolean;
  vpnDetected: boolean;
  tor: boolean;
  failedAttempts: number;
}

interface SecurityAlert {
  id: string;
  timestamp: Date;
  type: "anomaly" | "breach" | "suspicious" | "policy_violation";
  severity: "Low" | "Medium" | "High" | "Critical";
  title: string;
  description: string;
  userId?: string;
  username?: string;
  ipAddress?: string;
  country?: string;
  status: "new" | "investigating" | "resolved" | "false_positive";
  assignedTo?: string;
}

interface DashboardMetrics {
  totalLogins24h: number;
  anomalousLogins24h: number;
  activeUsers: number;
  newDevices24h: number;
  criticalAlerts: number;
  avgRiskScore: number;
  topRiskCountries: Array<{ country: string; count: number; riskScore: number }>;
  loginTrends: Array<{ time: string; successful: number; failed: number; anomalous: number }>;
  riskDistribution: Array<{ level: string; count: number; percentage: number }>;
}

@Injectable()
export class SocService {
  constructor(
    @InjectRepository(LoginActivity, 'applicationConnection')
    private readonly loginActivityRepository: Repository<LoginActivity>,
  ) {}

  private getStartAndEndOfDay(dateString?: string): { startOfDay: Date; endOfDay: Date } {
    const date = dateString ? new Date(dateString) : new Date();
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    return { startOfDay, endOfDay };
  }

  async getDashboardMetrics(date?: string) {
    const { startOfDay, endOfDay } = this.getStartAndEndOfDay(date);

    const recordsForDay = await this.loginActivityRepository.find({
      where: { timestamp: Between(startOfDay, endOfDay) },
      relations: ['user'],
    });

    console.log(`Found ${recordsForDay.length} login activities for ${startOfDay.toDateString()}.`);

    const totalLogins = recordsForDay.length;
    const anomalousLogins = recordsForDay.filter(a => a.isAnomaly).length;
    const activeUsers = new Set(recordsForDay.filter(a => a.loginSuccessful).map(a => a.userId)).size;
    const criticalAlerts = recordsForDay.filter(a => a.severity === 'Critical').length;
    const avgRiskScore = recordsForDay.reduce((sum, a) => sum + a.anomalyScore, 0) / totalLogins || 0;

    const countryRisks = new Map<string, { count: number; totalRisk: number }>();
    recordsForDay.forEach(attempt => {
      if (!attempt.country) return;
      const existing = countryRisks.get(attempt.country) || { count: 0, totalRisk: 0 };
      countryRisks.set(attempt.country, {
        count: existing.count + 1,
        totalRisk: existing.totalRisk + attempt.anomalyScore,
      });
    });

    const topRiskCountries = Array.from(countryRisks.entries())
      .map(([country, data]) => ({
        country,
        count: data.count,
        riskScore: Math.round(data.totalRisk / data.count),
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);

    const loginTrends = [];
    for (let i = 0; i < 24; i++) {
      const hourStart = new Date(startOfDay.getTime() + i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      const hourAttempts = recordsForDay.filter(a => a.timestamp >= hourStart && a.timestamp < hourEnd);
      loginTrends.push({
        time: hourStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        successful: hourAttempts.filter(a => a.loginSuccessful).length,
        failed: hourAttempts.filter(a => !a.loginSuccessful).length,
        anomalous: hourAttempts.filter(a => a.isAnomaly).length,
      });
    }

    const riskCounts = {
      Low: recordsForDay.filter(a => a.severity === 'Low').length,
      Medium: recordsForDay.filter(a => a.severity === 'Medium').length,
      High: recordsForDay.filter(a => a.severity === 'High').length,
      Critical: recordsForDay.filter(a => a.severity === 'Critical').length,
    };
    const riskDistribution = Object.entries(riskCounts).map(([level, count]) => ({
      level,
      count,
      percentage: Math.round((count / totalLogins) * 100) || 0,
    }));

    return {
      totalLogins24h: totalLogins,
      anomalousLogins24h: anomalousLogins,
      activeUsers,
      newDevices24h: 0,
      criticalAlerts,
      avgRiskScore: Math.round(avgRiskScore),
      topRiskCountries,
      loginTrends,
      riskDistribution,
    };
  }

  async getSecurityAlerts(date?: string) {
    const { startOfDay, endOfDay } = this.getStartAndEndOfDay(date);

    const alerts = await this.loginActivityRepository.find({
      where: { isAnomaly: true, timestamp: Between(startOfDay, endOfDay) },
      order: { timestamp: 'DESC' },
      take: 20,
      relations: ['user'],
    });

    return alerts.map(alert => ({
      id: alert.id.toString(),
      timestamp: alert.timestamp,
      type: 'anomaly',
      severity: alert.severity,
      title: 'Anomalous Login Detected',
      description: alert.anomalyReason,
      userId: alert.userId ? alert.userId.toString() : 'N/A',
      username: alert.user?.name || alert.email,
      ipAddress: alert.ipAddress,
      country: alert.country,
      status: 'new',
    }));
  }

  async getLoginAttempts(date?: string) {
    const { startOfDay, endOfDay } = this.getStartAndEndOfDay(date);
    
    const attempts = await this.loginActivityRepository.find({
      where: { timestamp: Between(startOfDay, endOfDay) },
      order: { timestamp: 'DESC' },
      take: 500,
      relations: ['user'],
    });
    
    return attempts.map(attempt => ({
      id: attempt.id.toString(),
      timestamp: attempt.timestamp,
      userId: attempt.userId ? attempt.userId.toString() : 'N/A',
      username: attempt.user?.name || attempt.email,
      email: attempt.email,
      ipAddress: attempt.ipAddress,
      country: attempt.country,
      city: 'N/A',
      device: attempt.deviceType,
      browser: attempt.browser,
      userAgent: attempt.userAgent,
      success: attempt.loginSuccessful,
      riskLevel: attempt.severity,
      riskScore: attempt.anomalyScore,
      anomalyReasons: attempt.anomalyReason ? attempt.anomalyReason.split(',') : [],
      isNewDevice: false,
      isNewLocation: false,
      vpnDetected: false,
      tor: false,
      failedAttempts: 0,
    }));
  }
}
