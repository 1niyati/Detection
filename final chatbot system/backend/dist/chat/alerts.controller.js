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
exports.AlertsController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
let AlertsController = class AlertsController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    handleAlert(alertData) {
        console.log('[ALERT RECEIVED]:', JSON.stringify(alertData, null, 2));
        // Pass the alert to the ChatService to generate recommendations
        // This will happen in the background
        this.chatService.processAnomalousLogin(alertData);
        return { message: 'Alert received' };
    }
};
__decorate([
    (0, common_1.Post)('alert'),
    (0, common_1.HttpCode)(200) // Respond immediately with OK
    ,
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "handleAlert", null);
AlertsController = __decorate([
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], AlertsController);
exports.AlertsController = AlertsController;
