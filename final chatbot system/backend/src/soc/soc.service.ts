import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between, In, LessThan, ILike } from 'typeorm';
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

    // --- Start of new logic to calculate new devices ---
    let newDevices24h = 0;
    if (recordsForDay.length > 0) {
      const userIds = [...new Set(recordsForDay.map(r => r.userId))];
      // Get all devices used by these users before today
      const previousLogins = await this.loginActivityRepository.find({
        where: { userId: In(userIds), timestamp: LessThan(startOfDay) },
        select: ['userId', 'deviceType'],
      });

      // Create a map of users and their known devices
      const userDevices = new Map<number, Set<string>>();
      for (const login of previousLogins) {
        if (!userDevices.has(login.userId)) {
          userDevices.set(login.userId, new Set());
        }
        userDevices.get(login.userId)!.add(login.deviceType);
      }

      // Check each of today's records against the known devices
      const dailyDevices = new Map<number, Set<string>>();
      for (const record of recordsForDay) {
        const seenDevices = userDevices.get(record.userId);
        const seenToday = dailyDevices.get(record.userId);

        // A new device is one not seen before today AND not already seen today
        if ((!seenDevices || !seenDevices.has(record.deviceType)) && (!seenToday || !seenToday.has(record.deviceType))) {
          newDevices24h++;
        }
        
        // Add the device to today's set to avoid double counting
        if (!seenToday) {
          dailyDevices.set(record.userId, new Set([record.deviceType]));
        } else {
          seenToday.add(record.deviceType);
        }
      }
    }
    // --- End of new logic ---

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
      newDevices24h, // Replaced hardcoded 0
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
    
    // --- Start of new logic for isNewDevice/isNewLocation ---
    const userIds = [...new Set(attempts.map(a => a.userId))];
    if (userIds.length === 0) return [];

    const previousLogins = await this.loginActivityRepository.find({
      where: { userId: In(userIds), timestamp: LessThan(startOfDay) },
      select: ['userId', 'deviceType', 'country'],
    });

    const userHistory = new Map<number, { devices: Set<string>, locations: Set<string> }>();
    for (const login of previousLogins) {
      if (!userHistory.has(login.userId)) {
        userHistory.set(login.userId, { devices: new Set(), locations: new Set() });
      }
      const history = userHistory.get(login.userId);
      if (history) {
        history.devices.add(login.deviceType);
        if (login.country) {
          history.locations.add(login.country);
        }
      }
    }
    // --- End of new logic ---

    // Keep track of devices/locations seen within the current day's attempts
    const dailyHistory = new Map<number, { devices: Set<string>, locations: Set<string> }>();

    return attempts.map(attempt => {
      const pastHistory = userHistory.get(attempt.userId);
      const todayHistory = dailyHistory.get(attempt.userId);

      const isNewDeviceFromPast = pastHistory ? !pastHistory.devices.has(attempt.deviceType) : true;
      const isNewDeviceFromToday = todayHistory ? !todayHistory.devices.has(attempt.deviceType) : true;
      const isNewDevice = isNewDeviceFromPast && isNewDeviceFromToday;

      let isNewLocation = false;
      if (attempt.country) {
        const isNewLocationFromPast = pastHistory ? !pastHistory.locations.has(attempt.country) : true;
        const isNewLocationFromToday = todayHistory ? !todayHistory.locations.has(attempt.country) : true;
        isNewLocation = isNewLocationFromPast && isNewLocationFromToday;
      }

      // Update daily history to handle multiple logins from the same new device/location in one day
      if (!dailyHistory.has(attempt.userId)) {
        dailyHistory.set(attempt.userId, { devices: new Set(), locations: new Set() });
      }
      dailyHistory.get(attempt.userId)!.devices.add(attempt.deviceType);
      if (attempt.country) {
        dailyHistory.get(attempt.userId)!.locations.add(attempt.country);
      }
      
      return {
        id: attempt.id.toString(),
        timestamp: attempt.timestamp,
        userId: attempt.userId ? attempt.userId.toString() : 'N/A',
        username: attempt.user?.name || attempt.email,
        email: attempt.email,
        ipAddress: attempt.ipAddress,
        country: attempt.country,
        city: 'N/A', // Stays N/A as it's not in the entity
        device: attempt.deviceType,
        browser: attempt.browser,
        userAgent: attempt.userAgent,
        success: attempt.loginSuccessful,
        riskLevel: attempt.severity,
        riskScore: attempt.anomalyScore,
        anomalyReasons: attempt.anomalyReason ? attempt.anomalyReason.split(',') : [],
        isNewDevice, // Replaced hardcoded false
        isNewLocation, // Replaced hardcoded false
        vpnDetected: false, // Stays false
        tor: false, // Stays false
        failedAttempts: 0, // Stays 0
      };
    });
  }

  async getSuspiciousSummary(timeWindow?: string, category?: string): Promise<{ summary: string }> {
    const isRecent = timeWindow === 'recent';
    const timeAgo = isRecent
      ? new Date(Date.now() - 5 * 60 * 1000) // 5 minutes
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    const timeText = isRecent ? "last 5 minutes" : "last 24 hours";
    const categoryText = category ? ` related to '${category}'` : '';

    const whereOptions: any = {
      timestamp: MoreThan(timeAgo),
      severity: In(['High', 'Critical']),
    };

    if (category) {
      whereOptions.anomalyReason = ILike(`%${category}%`);
    }

    const suspiciousActivities = await this.loginActivityRepository.find({
      where: whereOptions,
      relations: ['user'],
      order: {
        timestamp: 'DESC',
      },
    });

    // Filter to only include explicitly flagged suspicious activities
    const actionableAlerts = suspiciousActivities.filter(activity => 
      activity.anomalyReason && activity.anomalyReason.toLowerCase().startsWith('suspicious login flagged')
    );

    if (actionableAlerts.length === 0) {
      return {
        summary: `No actionable suspicious login attempts${categoryText} detected in the ${timeText}. The system appears secure.`
      };
    }

    // New, more professional summary generation based on actionable alerts
    const alertCount = actionableAlerts.length;
    const timeFrameText = isRecent ? "in the last 5 minutes" : "in the last 24 hours";
    let summary = `### Suspicious Login Report\n\n**${alertCount}** actionable alert(s)${categoryText} detected ${timeFrameText}. Details:\n\n`;

    actionableAlerts.forEach((activity, index) => {
      const recommendation = this.getSpecificRecommendation(activity.anomalyReason);
      summary += `\n\n---\n\n`;
      summary += `**Alert ${index + 1}**\n\n`;
      summary += `- **User Email:** ${activity.email}\n`;
      summary += `- **Time:** ${activity.timestamp.toLocaleString()}\n`;
      summary += `- **Risk Level:** ${activity.severity}\n`;
      summary += `- **Reason:** ${activity.anomalyReason}\n`;
      summary += `- **Recommendation:** ${recommendation}`; // Directly add the specific recommendation
    });

    return { summary };
  }

  // This function will provide specific advice based on the anomaly reason.
  private getSpecificRecommendation(reason: string): string {
    if (!reason) {
      return "No specific reason provided. A manual review of the user's recent activity is recommended.";
    }
  
    const lowerReason = reason.toLowerCase();
    const recommendations: string[] = [];
  
    if (lowerReason.includes('new ip address')) {
      recommendations.push("Verify with the user if they are using a new network or VPN. If not, this could indicate an unauthorized login attempt from an unknown location. Immediate password reset is advised.");
    }
  
    if (lowerReason.includes('new browser')) {
      recommendations.push("Confirm with the user if they have recently switched to a new device or browser. If unrecognized, this could suggest session hijacking or credential theft. A password reset is recommended.");
    }
  
    if (lowerReason.includes('unusual login time')) {
      recommendations.push("Check with the user to confirm if they were active at this time. Unauthorized access often occurs during off-hours. If the user cannot confirm, investigate for other signs of compromise.");
    }
  
    if (lowerReason.includes('ml model')) {
      recommendations.push("The machine learning model flagged this login as a deviation from the user's established behavior patterns. A manual review of the session's details is necessary to determine the nature of the risk.");
    }
  
    if (recommendations.length > 0) {
      return recommendations.join(' ');
    }
  
    // Fallback for generic reasons
    return "A suspicious activity was detected. Investigate the user's recent login patterns and session data to determine if the account has been compromised.";
  }
}
