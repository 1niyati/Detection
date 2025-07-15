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
exports.SocController = void 0;
const common_1 = require("@nestjs/common");
const soc_service_1 = require("./soc.service");
let SocController = class SocController {
    constructor(socService) {
        this.socService = socService;
    }
    getMetrics(date) {
        return this.socService.getDashboardMetrics(date);
    }
    getAlerts(date) {
        return this.socService.getSecurityAlerts(date);
    }
    getLoginAttempts(date) {
        return this.socService.getLoginAttempts(date);
    }
    getSuspiciousSummary(timeWindow) {
        return this.socService.getSuspiciousSummary(timeWindow);
    }
};
__decorate([
    (0, common_1.Get)('metrics'),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SocController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SocController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('login-attempts'),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SocController.prototype, "getLoginAttempts", null);
__decorate([
    (0, common_1.Get)('suspicious-summary'),
    __param(0, (0, common_1.Query)('timeWindow')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SocController.prototype, "getSuspiciousSummary", null);
SocController = __decorate([
    (0, common_1.Controller)('soc'),
    __metadata("design:paramtypes", [soc_service_1.SocService])
], SocController);
exports.SocController = SocController;
