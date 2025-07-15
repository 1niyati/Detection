"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const soc_service_1 = require("./soc.service");
const soc_controller_1 = require("./soc.controller");
const login_activity_entity_1 = require("./entities/login-activity.entity");
const soc_user_entity_1 = require("./entities/soc-user.entity");
let SocModule = class SocModule {
};
SocModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([login_activity_entity_1.LoginActivity, soc_user_entity_1.SocUser], 'applicationConnection'),
        ],
        controllers: [soc_controller_1.SocController],
        providers: [soc_service_1.SocService],
        exports: [soc_service_1.SocService], // Make the service available to other modules
    })
], SocModule);
exports.SocModule = SocModule;
