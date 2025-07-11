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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../auth/entities/user.entity");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const chat_message_entity_1 = require("../chat/entities/chat-message.entity");
// A simple in-memory cache to avoid hammering the alerts endpoint
const alertCache = {
    data: null,
    timestamp: 0,
};
let DashboardService = class DashboardService {
    constructor(userRepository, messageRepository, httpService) {
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
        this.httpService = httpService;
    }
    async getStats() {
        const totalUsers = await this.userRepository.count();
        const userRoles = await this.userRepository.query('SELECT role, COUNT(id) as count FROM users GROUP BY role');
        const alerts = await this.getAlerts();
        const suspiciousActivities = alerts.length;
        return {
            totalUsers,
            userRoles,
            suspiciousActivities,
        };
    }
    async getAlerts() {
        const cacheDuration = 30000; // 30 seconds
        const now = Date.now();
        if (alertCache.data && now - alertCache.timestamp < cacheDuration) {
            return alertCache.data;
        }
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get('http://localhost:8000/auth/alerts/suspicious-logins'));
            alertCache.data = response.data;
            alertCache.timestamp = now;
            return response.data;
        }
        catch (error) {
            console.error('Failed to fetch alerts from FastAPI service', error);
            return []; // Return empty array on failure
        }
    }
    async getLoginActivity() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const logins = await this.userRepository.find({
            where: { lastLogin: (0, typeorm_2.MoreThan)(sevenDaysAgo) },
            select: ['lastLogin'],
        });
        // Process data for chart
        const activity = logins.reduce((acc, user) => {
            if (user.lastLogin) {
                const day = user.lastLogin.toISOString().split('T')[0];
                acc[day] = (acc[day] || 0) + 1;
            }
            return acc;
        }, {});
        return Object.entries(activity).map(([date, count]) => ({ date, count }));
    }
    async getUserRoleDistribution() {
        return this.userRepository.query('SELECT role, COUNT(id)::int as count FROM users GROUP BY role ORDER BY role');
    }
    async getRecentActivity() {
        // Get the last 10 user messages, along with user info
        return this.messageRepository.find({
            where: { role: 'user' },
            relations: ['session', 'session.user'],
            order: { createdAt: 'DESC' },
            take: 10,
        });
    }
    async getAllUsers() {
        return this.userRepository.find({
            order: { createdAt: 'DESC' },
            select: ['id', 'name', 'email', 'role', 'lastLogin', 'createdAt'], // Explicitly select columns to avoid sending password
        });
    }
};
DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(chat_message_entity_1.ChatMessage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        axios_1.HttpService])
], DashboardService);
exports.DashboardService = DashboardService;
