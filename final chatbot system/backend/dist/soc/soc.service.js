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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
        this.OFFICE_NETWORK_PREFIXES = [
            '10.0.',
            '10.10.',
            '192.168.1.',
            '172.16.',
        ];
    }
    isOfficeNetwork(ipAddress) {
        if (!ipAddress)
            return false;
        return this.OFFICE_NETWORK_PREFIXES.some((prefix) => ipAddress.startsWith(prefix));
    }
    getFailedLoginThreshold(ipAddress) {
        return this.isOfficeNetwork(ipAddress) ? 5 : 3;
    }
    buildFailedAttemptMap(records) {
        const sorted = [...records].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const failedAttemptMap = new Map();
        const consecutiveFailures = new Map();
        for (const record of sorted) {
            const networkType = this.isOfficeNetwork(record.ipAddress) ? 'office' : 'home';
            const key = `${record.email}-${networkType}`;
            if (record.loginSuccessful) {
                consecutiveFailures.set(key, 0);
                failedAttemptMap.set(record.id, 0);
                continue;
            }
            const currentCount = (consecutiveFailures.get(key) || 0) + 1;
            consecutiveFailures.set(key, currentCount);
            failedAttemptMap.set(record.id, currentCount);
        }
        return failedAttemptMap;
    }
    getDerivedAnomaly(record, failedAttempts) {
        const threshold = this.getFailedLoginThreshold(record.ipAddress);
        const isOffice = this.isOfficeNetwork(record.ipAddress);
        if (!record.loginSuccessful) {
            const triggered = failedAttempts >= threshold;
            let severity = 'Low';
            if (triggered) {
                severity = failedAttempts >= threshold + 2 ? 'Critical' : 'High';
            }
            else if (failedAttempts === threshold - 1) {
                severity = 'Medium';
            }
            return {
                isAnomaly: triggered,
                anomalyReason: triggered
                    ? `Suspicious login flagged: ${failedAttempts} failed logins on ${isOffice ? 'office' : 'home'} network (threshold: ${threshold})`
                    : `Failed login count below threshold for ${isOffice ? 'office' : 'home'} network (${failedAttempts}/${threshold})`,
                severity,
            };
        }
        return {
            isAnomaly: record.isAnomaly,
            anomalyReason: record.anomalyReason || '',
            severity: record.severity,
        };
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
        const failedAttemptMap = this.buildFailedAttemptMap(recordsForDay);
        const enrichedRecords = recordsForDay.map((record) => {
            const failedAttempts = failedAttemptMap.get(record.id) || 0;
            const derived = this.getDerivedAnomaly(record, failedAttempts);
            return Object.assign(Object.assign({}, record), { derivedIsAnomaly: derived.isAnomaly, derivedSeverity: derived.severity, derivedReason: derived.anomalyReason, failedAttempts });
        });
        let newDevices24h = 0;
        if (recordsForDay.length > 0) {
            const userIds = [...new Set(recordsForDay.map((r) => r.userId))];
            const previousLogins = await this.loginActivityRepository.find({
                where: { userId: (0, typeorm_2.In)(userIds), timestamp: (0, typeorm_2.LessThan)(startOfDay) },
                select: ['userId', 'deviceType'],
            });
            const userDevices = new Map();
            for (const login of previousLogins) {
                if (!userDevices.has(login.userId)) {
                    userDevices.set(login.userId, new Set());
                }
                userDevices.get(login.userId).add(login.deviceType);
            }
            const dailyDevices = new Map();
            for (const record of recordsForDay) {
                const seenDevices = userDevices.get(record.userId);
                const seenToday = dailyDevices.get(record.userId);
                if ((!seenDevices || !seenDevices.has(record.deviceType)) &&
                    (!seenToday || !seenToday.has(record.deviceType))) {
                    newDevices24h++;
                }
                if (!seenToday) {
                    dailyDevices.set(record.userId, new Set([record.deviceType]));
                }
                else {
                    seenToday.add(record.deviceType);
                }
            }
        }
        const totalLogins = recordsForDay.length;
        const anomalousLogins = enrichedRecords.filter((a) => a.derivedIsAnomaly).length;
        const activeUsers = new Set(recordsForDay.filter((a) => a.loginSuccessful).map((a) => a.userId)).size;
        const criticalAlerts = enrichedRecords.filter((a) => a.derivedSeverity === 'Critical').length;
        const avgRiskScore = enrichedRecords.reduce((sum, a) => sum + a.anomalyScore, 0) / totalLogins || 0;
        const countryRisks = new Map();
        recordsForDay.forEach((attempt) => {
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
            const hourAttempts = recordsForDay.filter((a) => a.timestamp >= hourStart && a.timestamp < hourEnd);
            loginTrends.push({
                time: hourStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                successful: hourAttempts.filter((a) => a.loginSuccessful).length,
                failed: hourAttempts.filter((a) => !a.loginSuccessful).length,
                anomalous: hourAttempts.filter((a) => {
                    const failedAttempts = failedAttemptMap.get(a.id) || 0;
                    return this.getDerivedAnomaly(a, failedAttempts).isAnomaly;
                }).length,
            });
        }
        const riskCounts = {
            Low: enrichedRecords.filter((a) => a.derivedSeverity === 'Low').length,
            Medium: enrichedRecords.filter((a) => a.derivedSeverity === 'Medium').length,
            High: enrichedRecords.filter((a) => a.derivedSeverity === 'High').length,
            Critical: enrichedRecords.filter((a) => a.derivedSeverity === 'Critical').length,
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
            newDevices24h,
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
            where: { timestamp: (0, typeorm_2.Between)(startOfDay, endOfDay) },
            order: { timestamp: 'DESC' },
            take: 20,
            relations: ['user'],
        });
        const failedAttemptMap = this.buildFailedAttemptMap(alerts);
        return alerts
            .map((alert) => {
            var _a;
            const failedAttempts = failedAttemptMap.get(alert.id) || 0;
            const derived = this.getDerivedAnomaly(alert, failedAttempts);
            return {
                id: alert.id.toString(),
                timestamp: alert.timestamp,
                type: 'anomaly',
                severity: derived.severity,
                title: 'Anomalous Login Detected',
                description: derived.anomalyReason,
                userId: alert.userId ? alert.userId.toString() : 'N/A',
                username: ((_a = alert.user) === null || _a === void 0 ? void 0 : _a.name) || alert.email,
                ipAddress: alert.ipAddress,
                country: alert.country,
                status: 'new',
                isAnomaly: derived.isAnomaly,
            };
        })
            .filter((alert) => alert.isAnomaly)
            .map((_a) => {
            var { isAnomaly } = _a, alert = __rest(_a, ["isAnomaly"]);
            return alert;
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
        const failedAttemptMap = this.buildFailedAttemptMap(attempts);
        const userIds = [...new Set(attempts.map((a) => a.userId))];
        if (userIds.length === 0)
            return [];
        const previousLogins = await this.loginActivityRepository.find({
            where: { userId: (0, typeorm_2.In)(userIds), timestamp: (0, typeorm_2.LessThan)(startOfDay) },
            select: ['userId', 'deviceType', 'country'],
        });
        const userHistory = new Map();
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
        const dailyHistory = new Map();
        return attempts.map((attempt) => {
            var _a;
            const failedAttempts = failedAttemptMap.get(attempt.id) || 0;
            const derived = this.getDerivedAnomaly(attempt, failedAttempts);
            const pastHistory = userHistory.get(attempt.userId);
            const todayHistory = dailyHistory.get(attempt.userId);
            const isNewDeviceFromPast = pastHistory ? !pastHistory.devices.has(attempt.deviceType) : true;
            const isNewDeviceFromToday = todayHistory
                ? !todayHistory.devices.has(attempt.deviceType)
                : true;
            const isNewDevice = isNewDeviceFromPast && isNewDeviceFromToday;
            let isNewLocation = false;
            if (attempt.country) {
                const isNewLocationFromPast = pastHistory
                    ? !pastHistory.locations.has(attempt.country)
                    : true;
                const isNewLocationFromToday = todayHistory
                    ? !todayHistory.locations.has(attempt.country)
                    : true;
                isNewLocation = isNewLocationFromPast && isNewLocationFromToday;
            }
            if (!dailyHistory.has(attempt.userId)) {
                dailyHistory.set(attempt.userId, { devices: new Set(), locations: new Set() });
            }
            dailyHistory.get(attempt.userId).devices.add(attempt.deviceType);
            if (attempt.country) {
                dailyHistory.get(attempt.userId).locations.add(attempt.country);
            }
            return {
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
                riskLevel: derived.severity,
                riskScore: attempt.anomalyScore,
                anomalyReasons: derived.anomalyReason ? [derived.anomalyReason] : [],
                isNewDevice,
                isNewLocation,
                vpnDetected: false,
                tor: false,
                failedAttempts,
            };
        });
    }
    async getSuspiciousSummary(timeWindow, category) {
        const isRecent = timeWindow === 'recent';
        const timeAgo = isRecent
            ? new Date(Date.now() - 5 * 60 * 1000)
            : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const timeText = isRecent ? 'last 5 minutes' : 'last 24 hours';
        const categoryText = category ? ` related to '${category}'` : '';
        const whereOptions = {
            timestamp: (0, typeorm_2.MoreThan)(timeAgo),
            severity: (0, typeorm_2.In)(['High', 'Critical']),
        };
        if (category) {
            whereOptions.anomalyReason = (0, typeorm_2.ILike)(`%${category}%`);
        }
        const suspiciousActivities = await this.loginActivityRepository.find({
            where: whereOptions,
            relations: ['user'],
            order: {
                timestamp: 'DESC',
            },
        });
        const actionableAlerts = suspiciousActivities.filter((activity) => activity.isAnomaly === true);
        if (actionableAlerts.length === 0) {
            return {
                summary: `No actionable suspicious login attempts${categoryText} detected in the ${timeText}. The system appears secure.`,
            };
        }
        const alertCount = actionableAlerts.length;
        const timeFrameText = isRecent ? 'in the last 5 minutes' : 'in the last 24 hours';
        let summary = `### Suspicious Login Report\n\n**${alertCount}** actionable alert(s)${categoryText} detected ${timeFrameText}. Details:\n\n`;
        actionableAlerts.forEach((activity, index) => {
            const recommendation = this.getSpecificRecommendation(activity.anomalyReason);
            summary += `\n\n---\n\n`;
            summary += `**Alert ${index + 1}**\n\n`;
            summary += `- **User Email:** ${activity.email}\n`;
            summary += `- **Time:** ${activity.timestamp.toLocaleString()}\n`;
            summary += `- **Risk Level:** ${activity.severity}\n`;
            summary += `- **Reason:** ${activity.anomalyReason}\n`;
            summary += `- **Recommendation:** ${recommendation}`;
        });
        return { summary };
    }
    getSpecificRecommendation(reason) {
        if (!reason) {
            return "No specific reason provided. A manual review of the user's recent activity is recommended.";
        }
        const lowerReason = reason.toLowerCase();
        const recommendations = [];
        if (lowerReason.includes('new ip address')) {
            recommendations.push('Verify with the user if they are using a new network or VPN. If not, this could indicate an unauthorized login attempt from an unknown location. Immediate password reset is advised.');
        }
        if (lowerReason.includes('new browser')) {
            recommendations.push('Confirm with the user if they have recently switched to a new device or browser. If unrecognized, this could suggest session hijacking or credential theft. A password reset is recommended.');
        }
        if (lowerReason.includes('unusual login time')) {
            recommendations.push('Check with the user to confirm if they were active at this time. Unauthorized access often occurs during off-hours. If the user cannot confirm, investigate for other signs of compromise.');
        }
        if (lowerReason.includes('ml model')) {
            recommendations.push("The machine learning model flagged this login as a deviation from the user's established behavior patterns. A manual review of the session's details is necessary to determine the nature of the risk.");
        }
        if (recommendations.length > 0) {
            return recommendations.join(' ');
        }
        return "A suspicious activity was detected. Investigate the user's recent login patterns and session data to determine if the account has been compromised.";
    }
};
SocService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(login_activity_entity_1.LoginActivity, 'applicationConnection')),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SocService);
exports.SocService = SocService;
