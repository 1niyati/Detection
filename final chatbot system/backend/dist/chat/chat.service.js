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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
const chat_session_entity_1 = require("./entities/chat-session.entity");
const chat_message_entity_1 = require("./entities/chat-message.entity");
const soc_service_1 = require("../soc/soc.service");
dotenv.config();
const GENERAL_PROMPT = `You are CyberBOT, an AI-powered SOC assistant. Your primary role is to help security analysts by providing recommendations, analyzing login anomalies, and answering SOC-related questions. When asked who you are, introduce yourself as CyberBOT and state your purpose. For general greetings, be friendly and professional.

Example:
User: Who are you?
Assistant: I’m CyberBOT, your AI-powered SOC assistant. I'm here to help you analyze security events and provide recommendations.

User: Hello
Assistant: Hi there! How can I help you today?
`.trim();
const SECURITY_PROMPT = `
You are CyberBot, an advanced AI Security Assistant in SENTINEL SOC. 

RESPONSE FORMATTING RULES:
1. For general security questions:
   - Provide clear, structured answers with bullet points
   - Use markdown formatting for better readability
   - Include relevant security best practices

2. For incident analysis requests:
   Structure your response in this format:
   
   ## Required Information
   Please provide:
   - **Incident Type**: [Type of security incident]
   - **Affected Systems**: [Systems, IPs, users involved]
   - **Timestamp**: [Date and time of incident]
   - **Alert Details**: [Relevant logs or alerts]
   - **Source Data**: [Source IPs, domains, hashes]

3. For threat assessments:
   - **Severity**: [High/Medium/Low]
   - **Impact**: [Potential impact]
   - **Mitigation Steps**: [Numbered list of actions]
   - **Recommendations**: [Security recommendations]

Always maintain a professional tone and prioritize clarity in security communications.
`.trim();
const SECURITY_KEYWORDS = [
    'security',
    'hack',
    'vulnerability',
    'threat',
    'malware',
    'virus',
    'breach',
    'attack',
    'firewall',
    'encryption',
    'password',
    'authentication',
    'exploit',
    'cybersecurity',
    'phishing',
    'ransomware',
    'incident',
    'alert',
    'suspicious',
    'compromise',
    'unauthorized',
    'detection',
    'logins',
    'anomaly',
    'attempt',
    'failed',
];
let ChatService = class ChatService {
    constructor(sessionRepository, messageRepository, socService) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.socService = socService;
        this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    }
    getSpecificRecommendation(reason) {
        const lowerReason = reason.toLowerCase();
        if (lowerReason.includes('permanently blocked')) {
            return 'This account is now permanently blocked. Review the source IP of the failed attempts for potential network-level blocking.';
        }
        const recommendations = [];
        if (lowerReason.includes('new country')) {
            recommendations.push('Confirm with the user if they are traveling or using a VPN. If not, immediate account lockout and password reset is advised.');
        }
        if (lowerReason.includes('new browser')) {
            recommendations.push('Verify with the user if they recently started using a new device or browser. If not, a password reset is recommended as a precaution.');
        }
        if (lowerReason.includes('unusual time')) {
            recommendations.push("Verify the legitimacy of this login with the user. If they don't recognize this activity, investigate further and consider a password reset.");
        }
        if (lowerReason.includes('ml model')) {
            recommendations.push("The AI model detected a deviation from normal behavior. A manual review of the user's session data is recommended to determine the nature of the anomaly.");
        }
        if (recommendations.length > 0) {
            return '\n- ' + recommendations.join('\n- ');
        }
        return "A generic suspicious activity was detected. You should investigate this user's recent activity and consider temporarily disabling the account if the activity is confirmed to be malicious.";
    }
    isSecurityRelatedQuery(text) {
        const lowerText = text.toLowerCase();
        return SECURITY_KEYWORDS.some((keyword) => lowerText.includes(keyword));
    }
    async getChatSessions(userId) {
        return this.sessionRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    async getMessagesForSession(sessionId, userId) {
        const session = await this.sessionRepository.findOne({ where: { id: sessionId, userId } });
        if (!session) {
            throw new common_1.NotFoundException('Chat session not found');
        }
        return this.messageRepository.find({
            where: { sessionId },
            order: { createdAt: 'ASC' },
        });
    }
    async deleteSession(sessionId, userId) {
        const session = await this.sessionRepository.findOne({ where: { id: sessionId, userId } });
        if (!session) {
            throw new common_1.NotFoundException('Chat session not found');
        }
        await this.sessionRepository.remove(session);
        return { message: 'Chat session deleted successfully' };
    }
    async updateMessage(messageId, userId, content) {
        const messageToEdit = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['session'],
        });
        if (!messageToEdit)
            throw new common_1.NotFoundException('Message not found');
        if (messageToEdit.session.userId !== userId)
            throw new common_1.UnauthorizedException('Permission denied');
        if (messageToEdit.role !== 'user')
            throw new common_1.UnauthorizedException('Can only edit user messages');
        messageToEdit.content = content;
        const updatedUserMessage = await this.messageRepository.save(messageToEdit);
        const subsequentMessages = await this.messageRepository.find({
            where: {
                sessionId: messageToEdit.sessionId,
                id: (0, typeorm_2.MoreThan)(messageId),
            },
        });
        if (subsequentMessages.length > 0) {
            await this.messageRepository.remove(subsequentMessages);
        }
        const newAssistantResponse = await this.chatWithGemini(content, userId, messageToEdit.sessionId, true);
        return {
            userMessage: updatedUserMessage,
            assistantResponse: newAssistantResponse.assistantMessage,
        };
    }
    async chatWithGemini(newMessageContent, userId, sessionId, isInternalCall = false) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        let session;
        let messageHistory = [];
        if (sessionId) {
            const foundSession = await this.sessionRepository.findOne({ where: { id: sessionId } });
            if (!foundSession)
                throw new common_1.NotFoundException('Chat session not found');
            if (foundSession.userId !== userId)
                throw new common_1.UnauthorizedException('Access to this session is denied');
            session = foundSession;
            messageHistory = await this.getMessagesForSession(sessionId, userId);
        }
        else {
            const title = newMessageContent.slice(0, 40) + (newMessageContent.length > 40 ? '...' : '');
            session = this.sessionRepository.create({ title, userId });
            await this.sessionRepository.save(session);
        }
        if (!isInternalCall) {
            const userMessage = this.messageRepository.create({
                role: 'user',
                content: newMessageContent,
                sessionId: session.id,
            });
            await this.messageRepository.save(userMessage);
            messageHistory.push(userMessage);
        }
        else {
            messageHistory.push({
                role: 'user',
                content: newMessageContent,
                sessionId: session.id,
            });
        }
        if (newMessageContent.toLowerCase().trim().includes('who are you')) {
            const introMessage = 'I’m CyberBOT, your AI-powered SOC assistant. I help to provide you with recommendations, analyze login anomalies, and answer SOC-related questions.';
            const assistantMessage = this.messageRepository.create({
                role: 'assistant',
                content: introMessage,
                sessionId: session.id,
            });
            await this.messageRepository.save(assistantMessage);
            return { assistantMessage, sessionId: session.id };
        }
        const securityKeywords = [
            'suspicious', 'anomaly', 'anomalies', 'alert', 'alerts',
            'threat', 'threats', 'report', 'detected', 'were', 'any',
            'show', 'high', 'medium', 'low', 'risk', 'login', 'logins',
            'hack', 'breach', 'attack', 'incident', 'flagged'
        ];
        const isSecurityQuery = securityKeywords.some((keyword) => newMessageContent.toLowerCase().includes(keyword));
        const isRecentQuery = newMessageContent.toLowerCase().includes('recent');
        if (isSecurityQuery) {
            const knownCategories = ['new ip address', 'new browser', 'unusual login time'];
            const foundCategory = knownCategories.find((cat) => newMessageContent.toLowerCase().includes(cat));
            const summary = await this.socService.getSuspiciousSummary(isRecentQuery ? 'recent' : '24-hour', foundCategory);
            const report = summary.summary.trim();
            const assistantMessage = this.messageRepository.create({
                role: 'assistant',
                content: report,
                sessionId: session.id,
            });
            await this.messageRepository.save(assistantMessage);
            return { assistantMessage, sessionId: session.id };
        }
        const historyForApi = messageHistory.map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));
        const conversationContext = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: GENERAL_PROMPT }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Understood, I will proceed with the conversation as configured.' }],
                },
                ...historyForApi,
            ],
        };
        try {
            console.log('Processing message:', newMessageContent);
            console.log('Security query:', isSecurityQuery);
            console.log('GEMINI KEY FOUND:', !!process.env.GEMINI_API_KEY);
            if (!process.env.GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY is missing from environment variables');
            }
            const response = await axios_1.default.post(`${this.geminiEndpoint}?key=${process.env.GEMINI_API_KEY}`, {
                contents: conversationContext.contents,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const text = ((_f = (_e = (_d = (_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text) || 'No response from Gemini.';
            console.log('Response received:', text.substring(0, 100) + '...');
            const assistantMessage = this.messageRepository.create({
                role: 'assistant',
                content: text,
                sessionId: session.id,
            });
            await this.messageRepository.save(assistantMessage);
            return { assistantMessage, sessionId: session.id };
        }
        catch (error) {
            console.error('Gemini API error:', ((_g = error.response) === null || _g === void 0 ? void 0 : _g.data) || error.message);
            let assistantResponse = 'Hello! I am CyberDefender AI, your SOC assistant. I can help you analyze security threats and login anomalies. Try asking me about suspicious activity, threats, anomalies, or alerts to get real-time security insights.';
            if (((_h = error.response) === null || _h === void 0 ? void 0 : _h.status) === 404) {
                assistantResponse = 'Gemini model endpoint was not found. Please verify the configured model name.';
            }
            else if ((_j = error.message) === null || _j === void 0 ? void 0 : _j.includes('GEMINI_API_KEY is missing')) {
                assistantResponse = 'Gemini API key is missing. Add GEMINI_API_KEY to backend/.env and restart the backend.';
            }
            if (((_k = error.response) === null || _k === void 0 ? void 0 : _k.status) === 400) {
                assistantResponse = 'Gemini request format was rejected. Please check the model and payload.';
            }
            else if (((_l = error.response) === null || _l === void 0 ? void 0 : _l.status) === 401 || ((_m = error.response) === null || _m === void 0 ? void 0 : _m.status) === 403) {
                assistantResponse =
                    'Gemini API key is invalid, expired, or has no remaining quota. Please replace GEMINI_API_KEY in backend/.env.';
            }
            else if (((_o = error.response) === null || _o === void 0 ? void 0 : _o.status) === 404) {
                assistantResponse =
                    'Gemini model endpoint was not found. Please verify the configured model name.';
            }
            else if ((_p = error.message) === null || _p === void 0 ? void 0 : _p.includes('GEMINI_API_KEY is missing')) {
                assistantResponse =
                    'Gemini API key is missing. Add GEMINI_API_KEY to backend/.env and restart the backend.';
            }
            const assistantMessage = this.messageRepository.create({
                role: 'assistant',
                content: assistantResponse,
                sessionId: session.id,
            });
            await this.messageRepository.save(assistantMessage);
            return { assistantMessage, sessionId: session.id };
        }
    }
};
ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_session_entity_1.ChatSession)),
    __param(1, (0, typeorm_1.InjectRepository)(chat_message_entity_1.ChatMessage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        soc_service_1.SocService])
], ChatService);
exports.ChatService = ChatService;
