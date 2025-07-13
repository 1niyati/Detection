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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const jwt_1 = require("@nestjs/jwt");
const user_entity_1 = require("./entities/user.entity");
let AuthService = class AuthService {
    constructor(userRepository, jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.initializeDefaultUsers();
    }
    async initializeDefaultUsers() {
        // Check if admin exists
        const adminExists = await this.userRepository.findOne({
            where: { email: 'admin@sentinelsoc.com' }
        });
        if (!adminExists) {
            // Add admin user
            const adminPassword = await bcrypt.hash('admin123', 10);
            const adminUser = this.userRepository.create({
                name: 'System Administrator',
                email: 'admin@sentinelsoc.com',
                password: adminPassword,
                role: 'admin',
                department: 'SENTINEL SOC Administration',
                isApproved: true,
                lastLogin: new Date(),
            });
            await this.userRepository.save(adminUser);
        }
        // Check if test analyst exists
        const analystExists = await this.userRepository.findOne({
            where: { email: 'Reteeac123@gmail.com' }
        });
        if (!analystExists) {
            // Add test analyst user
            const analystPassword = await bcrypt.hash('123456', 10);
            const testAnalyst = this.userRepository.create({
                name: 'Test Analyst',
                email: 'Reteeac123@gmail.com',
                password: analystPassword,
                role: 'analyst',
                department: 'Security Operations',
                isApproved: true,
            });
            await this.userRepository.save(testAnalyst);
        }
        // Log current users
        const allUsers = await this.userRepository.find();
        console.log('Current users in database:');
        console.table(allUsers.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            isApproved: user.isApproved,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        })));
    }
    async login({ email, password }) {
        console.log('\nLogin attempt for:', email);
        const user = await this.userRepository
            .createQueryBuilder('user')
            .where('user.email = :email', { email })
            .addSelect('user.password')
            .getOne();
        if (!user) {
            console.log('❌ User not found:', email);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('❌ Invalid password for user:', email);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        // Update last login
        user.lastLogin = new Date();
        await this.userRepository.save(user);
        console.log('✅ Login successful for:', email);
        const payload = { email: user.email, userId: user.id, role: user.role };
        const token = this.jwtService.sign(payload);
        return {
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                isApproved: user.isApproved,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                token: token, // Pass token within the user object
            }
        };
    }
    async signup({ name, email, password, role, department }) {
        console.log('\nSignup attempt:', { email, role, department });
        // Check if user exists
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            console.log('❌ Email already exists:', email);
            throw new common_1.UnauthorizedException('Email already exists');
        }
        // Don't allow creation of admin accounts through signup
        if (role === 'admin') {
            console.log('❌ Attempted to create admin account through signup');
            throw new common_1.UnauthorizedException('Cannot create admin accounts');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = this.userRepository.create({
            name,
            email,
            password: hashedPassword,
            role: role,
            department,
            isApproved: true,
        });
        await this.userRepository.save(newUser);
        console.log('✅ New user created successfully');
        const payload = { email: newUser.email, userId: newUser.id, role: newUser.role };
        const token = this.jwtService.sign(payload);
        return {
            success: true,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                department: newUser.department,
                isApproved: newUser.isApproved,
                createdAt: newUser.createdAt,
                token: token, // Pass token within the user object
            }
        };
    }
};
AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User, 'default')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
exports.AuthService = AuthService;
