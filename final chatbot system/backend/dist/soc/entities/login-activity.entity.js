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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginActivity = void 0;
// @ts-nocheck
const typeorm_1 = require("typeorm");
const soc_user_entity_1 = require("./soc-user.entity");
let LoginActivity = class LoginActivity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LoginActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], LoginActivity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => soc_user_entity_1.SocUser, user => user.loginActivities),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", soc_user_entity_1.SocUser)
], LoginActivity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LoginActivity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LoginActivity.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address' }),
    __metadata("design:type", String)
], LoginActivity.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LoginActivity.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], LoginActivity.prototype, "asn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent' }),
    __metadata("design:type", String)
], LoginActivity.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_type' }),
    __metadata("design:type", String)
], LoginActivity.prototype, "deviceType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LoginActivity.prototype, "browser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'operating_system' }),
    __metadata("design:type", String)
], LoginActivity.prototype, "operatingSystem", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'login_frequency' }),
    __metadata("design:type", Number)
], LoginActivity.prototype, "loginFrequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'login_successful' }),
    __metadata("design:type", Boolean)
], LoginActivity.prototype, "loginSuccessful", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LoginActivity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_anomaly' }),
    __metadata("design:type", Boolean)
], LoginActivity.prototype, "isAnomaly", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', name: 'anomaly_score' }),
    __metadata("design:type", Number)
], LoginActivity.prototype, "anomalyScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'anomaly_reason' }),
    __metadata("design:type", String)
], LoginActivity.prototype, "anomalyReason", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LoginActivity.prototype, "severity", void 0);
LoginActivity = __decorate([
    (0, typeorm_1.Entity)('login_activity')
], LoginActivity);
exports.LoginActivity = LoginActivity;
