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
exports.ChatLogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chat_log_entity_1 = require("./entities/chat-log.entity");
const user_entity_1 = require("../auth/entities/user.entity");
let ChatLogService = class ChatLogService {
    constructor(chatLogRepository, userRepository) {
        this.chatLogRepository = chatLogRepository;
        this.userRepository = userRepository;
    }
    async logChat(userId, userMessage, botResponse, metadata) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        const chatLog = this.chatLogRepository.create({
            user,
            userId,
            userMessage,
            botResponse,
            metadata,
            isError: false,
        });
        return this.chatLogRepository.save(chatLog);
    }
    async logError(userId, userMessage, errorMessage) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        const chatLog = this.chatLogRepository.create({
            user,
            userId,
            userMessage,
            botResponse: '',
            errorMessage,
            isError: true,
        });
        return this.chatLogRepository.save(chatLog);
    }
    async getUserChatHistory(userId) {
        return this.chatLogRepository.find({
            where: { userId },
            order: { timestamp: 'DESC' },
            relations: ['user'],
        });
    }
    async getAnalytics() {
        const [logs, totalChats] = await this.chatLogRepository.findAndCount();
        const uniqueUsers = new Set(logs.map(log => log.userId));
        const errorLogs = logs.filter(log => log.isError);
        const errorRate = errorLogs.length / totalChats;
        // Calculate response times (assuming metadata contains timing information)
        const responseTimes = logs
            .map(log => { var _a; return (_a = log.metadata) === null || _a === void 0 ? void 0 : _a.responseTime; })
            .filter(time => time != null);
        const averageResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0;
        // Get most common queries
        const queryCount = new Map();
        logs.forEach(log => {
            const count = queryCount.get(log.userMessage) || 0;
            queryCount.set(log.userMessage, count + 1);
        });
        const mostCommonQueries = Array.from(queryCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([query, count]) => ({ query, count }));
        // Get user stats
        const userStats = await Promise.all(Array.from(uniqueUsers).map(async (userId) => {
            var _a;
            const user = await this.userRepository.findOne({ where: { id: userId } });
            const userLogs = logs.filter(log => log.userId === userId);
            return {
                userId,
                userName: (user === null || user === void 0 ? void 0 : user.name) || 'Unknown',
                totalChats: userLogs.length,
                lastActive: ((_a = userLogs[0]) === null || _a === void 0 ? void 0 : _a.timestamp) || new Date(),
            };
        }));
        return {
            totalChats,
            totalUsers: uniqueUsers.size,
            averageResponseTime,
            errorRate,
            mostCommonQueries,
            userStats,
        };
    }
};
ChatLogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_log_entity_1.ChatLog)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ChatLogService);
exports.ChatLogService = ChatLogService;
