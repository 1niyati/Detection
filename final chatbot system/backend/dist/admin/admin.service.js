"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../auth/entities/user.entity");
const chat_message_entity_1 = require("../chat/entities/chat-message.entity");
const user_role_enum_1 = require("../auth/enums/user-role.enum");
const login_activity_entity_1 = require("../soc/entities/login-activity.entity");
let AdminService = class AdminService {
    constructor(userRepository, messageRepository, loginActivityRepository) {
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
        this.loginActivityRepository = loginActivityRepository;
    }
    async getSocStats(date) {
        let startDate;
        let endDate;
        if (date) {
            startDate = new Date(date);
            startDate.setUTCHours(0, 0, 0, 0);
            endDate = new Date(date);
            endDate.setUTCHours(23, 59, 59, 999);
        }
        else {
            endDate = new Date();
            startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        }
        const recentActivities = await this.loginActivityRepository.find({
            where: { timestamp: (0, typeorm_2.Between)(startDate, endDate) },
        });
        const highRiskEvents = recentActivities.filter(a => a.severity === 'High' || a.severity === 'Critical').length;
        const activeSessions = new Set(recentActivities.filter(a => a.loginSuccessful).map(a => a.userId)).size;
        const alertsPending = await this.loginActivityRepository.count({
            where: { isAnomaly: true, timestamp: (0, typeorm_2.Between)(startDate, endDate) }
        });
        return {
            loginAttempts24h: recentActivities.length,
            highRiskEvents,
            activeSessions,
            alertsPending,
        };
    }
    async getRecentActivities() {
        const activities = await this.messageRepository
            .createQueryBuilder('message')
            .leftJoinAndSelect('message.session', 'session')
            .leftJoinAndSelect('session.user', 'user')
            .where('user.role = :role', { role: user_role_enum_1.UserRole.Analyst })
            .andWhere("message.role = 'user'")
            .orderBy('message.createdAt', 'DESC')
            .limit(10)
            .getMany();
        return activities.map((activity) => {
            var _a, _b, _c;
            return ({
                user: (_c = (_b = (_a = activity.session) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : 'Unknown',
                action: activity.content,
                time: activity.createdAt,
                type: 'analyst_query',
            });
        });
    }
    async getAllUsers() {
        return this.userRepository.find({
            select: ['id', 'name', 'email', 'role', 'isApproved', 'lastLogin'],
            order: { createdAt: 'DESC' },
        });
    }
    async getUserById(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID "${id}" not found`);
        }
        return user;
    }
    async createUser(createUserDto) {
        const { email, name, password, role } = createUserDto;
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists.');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = this.userRepository.create({
            name,
            email,
            password: hashedPassword,
            role,
            isApproved: true, // New users created by an admin are approved by default
        });
        const savedUser = await this.userRepository.save(newUser);
        const { password: _ } = savedUser, result = __rest(savedUser, ["password"]);
        return result;
    }
    async getDashboardStats() {
        const totalUsers = await this.userRepository.count();
        const activeUsers = await this.userRepository.count({ where: { isApproved: true } });
        const pendingUsers = await this.userRepository.count({ where: { isApproved: false } });
        // Note: The 'suspended' status is not in the User entity.
        // This will require a schema change or be hardcoded as 0.
        const suspendedUsers = 0;
        return {
            totalUsers,
            activeUsers,
            pendingUsers,
            suspendedUsers,
        };
    }
};
AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User, 'default')),
    __param(1, (0, typeorm_1.InjectRepository)(chat_message_entity_1.ChatMessage, 'default')),
    __param(2, (0, typeorm_1.InjectRepository)(login_activity_entity_1.LoginActivity, 'applicationConnection')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
exports.AdminService = AdminService;
