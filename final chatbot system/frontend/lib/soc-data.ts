export interface LoginAttempt {
  id: string;
  timestamp: Date;
  ipAddress: string;
  username: string;
  success: boolean;
  source: string;
  location?: string;
  userAgent?: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  source: string;
  status: 'new' | 'investigating' | 'resolved';
  details?: Record<string, any>;
}

export interface DashboardMetrics {
  totalLoginAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  alertCount: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  recentAlerts: SecurityAlert[];
  loginTrend: {
    timestamp: Date;
    count: number;
  }[];
}

export function generateSecurityAlerts(loginAttempts: LoginAttempt[]): SecurityAlert[] {
  return loginAttempts
    .filter(attempt => !attempt.success)
    .map(attempt => ({
      id: `alert-${Date.now()}-${Math.random()}`,
      timestamp: attempt.timestamp,
      severity: Math.random() > 0.7 ? 'critical' : 
                Math.random() > 0.5 ? 'high' : 
                Math.random() > 0.3 ? 'medium' : 'low',
      type: 'failed-login',
      description: `Failed login attempt from ${attempt.ipAddress}`,
      source: attempt.source,
      status: 'new',
      details: {
        username: attempt.username,
        ipAddress: attempt.ipAddress,
        timestamp: attempt.timestamp
      }
    }));
}

export function generateMockLoginAttempts(): LoginAttempt[] {
  const now = new Date();
  const mockAttempts: LoginAttempt[] = [];
  
  // Generate some mock login attempts
  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000));
    const success = Math.random() > 0.3; // 30% failure rate
    
    mockAttempts.push({
      id: `login-${Date.now()}-${i}`,
      timestamp,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 100)}`,
      username: `user${Math.floor(Math.random() * 1000)}`,
      success,
      source: `web${Math.floor(Math.random() * 3) + 1}`,
      location: `Location ${Math.floor(Math.random() * 5)}`,
      userAgent: `Browser ${Math.floor(Math.random() * 3)}`
    });
  }
  
  return mockAttempts;
}

export function calculateDashboardMetrics(
  loginAttempts: LoginAttempt[],
  securityAlerts: SecurityAlert[]
): DashboardMetrics {
  const metrics: DashboardMetrics = {
    totalLoginAttempts: loginAttempts.length,
    successfulLogins: loginAttempts.filter(attempt => attempt.success).length,
    failedLogins: loginAttempts.filter(attempt => !attempt.success).length,
    alertCount: {
      low: securityAlerts.filter(alert => alert.severity === 'low').length,
      medium: securityAlerts.filter(alert => alert.severity === 'medium').length,
      high: securityAlerts.filter(alert => alert.severity === 'high').length,
      critical: securityAlerts.filter(alert => alert.severity === 'critical').length,
    },
    recentAlerts: securityAlerts.slice(0, 5),
    loginTrend: loginAttempts
      .map(attempt => ({
        timestamp: attempt.timestamp,
        count: 1
      }))
  };

  return metrics;
}
