"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const login_activity_entity_1 = require("./entities/login-activity.entity");
let SocService = class SocService {
    constructor(loginActivityRepository) {
        this.loginActivityRepository = loginActivityRepository;
    }
    getStartAndEndOfDay(dateString) {
        const date = dateString ? new Date(dateString) : new Date();
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        return { startOfDay, endOfDay };
    }
    async getDashboardMetrics(date) {
        const { startOfDay, endOfDay } = this.getStartAndEndOfDay(date);
        const recordsForDay = await this.loginActivityRepository.find({
            where: { timestamp: (0, typeorm_2.Between)(startOfDay, endOfDay) },
            relations: ['user'],
        });
        console.log(`Found ${recordsForDay.length} login activities for ${startOfDay.toDateString()}.`);
        const totalLogins = recordsForDay.length;
        const anomalousLogins = recordsForDay.filter(a => a.isAnomaly).length;
        const activeUsers = new Set(recordsForDay.filter(a => a.loginSuccessful).map(a => a.userId)).size;
        const criticalAlerts = recordsForDay.filter(a => a.severity === 'Critical').length;
        const avgRiskScore = recordsForDay.reduce((sum, a) => sum + a.anomalyScore, 0) / totalLogins || 0;
        const countryRisks = new Map();
        recordsForDay.forEach(attempt => {
            if (!attempt.country)
                return;
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
    async getSecurityAlerts(date) {
        const { startOfDay, endOfDay } = this.getStartAndEndOfDay(date);
        const alerts = await this.loginActivityRepository.find({
            where: { isAnomaly: true, timestamp: (0, typeorm_2.Between)(startOfDay, endOfDay) },
            order: { timestamp: 'DESC' },
            take: 20,
            relations: ['user'],
        });
        return alerts.map(alert => {
            var _a;
            return ({
                id: alert.id.toString(),
                timestamp: alert.timestamp,
                type: 'anomaly',
                severity: alert.severity,
                title: 'Anomalous Login Detected',
                description: alert.anomalyReason,
                userId: alert.userId ? alert.userId.toString() : 'N/A',
                username: ((_a = alert.user) === null || _a === void 0 ? void 0 : _a.name) || alert.email,
                ipAddress: alert.ipAddress,
                country: alert.country,
                status: 'new',
            });
        });
    }
    async getLoginAttempts(date) {
        const { startOfDay, endOfDay } = this.getStartAndEndOfDay(date);
        const attempts = await this.loginActivityRepository.find({
            where: { timestamp: (0, typeorm_2.Between)(startOfDay, endOfDay) },
            order: { timestamp: 'DESC' },
            take: 500,
            relations: ['user'],
        });
        return attempts.map(attempt => {
            var _a;
            return ({
                id: attempt.id.toString(),
                timestamp: attempt.timestamp,
                userId: attempt.userId ? attempt.userId.toString() : 'N/A',
                username: ((_a = attempt.user) === null || _a === void 0 ? void 0 : _a.name) || attempt.email,
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
            });
        });
    }
};
SocService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(login_activity_entity_1.LoginActivity, 'applicationConnection')),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SocService);
exports.SocService = SocService;
