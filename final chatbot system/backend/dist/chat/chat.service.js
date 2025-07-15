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
const soc_service_1 = require("../soc/soc.service"); // Import SocService
dotenv.config();
const GENERAL_PROMPT = `You are a friendly and helpful AI assistant. Engage in natural conversation while being helpful and concise. For greetings like "hello" or "hi", respond naturally as a friendly assistant would. Keep responses conversational yet professional.

Example:
User: Hello
Assistant: Hi there! How can I help you today?

User: How are you?
Assistant: I'm doing well, thank you for asking! How can I assist you today?
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
    'security', 'hack', 'vulnerability', 'threat', 'malware', 'virus',
    'breach', 'attack', 'firewall', 'encryption', 'password', 'authentication',
    'exploit', 'cybersecurity', 'phishing', 'ransomware', 'incident', 'alert',
    'suspicious', 'compromise', 'unauthorized', 'detection', 'logins', 'anomaly', 'attempt', 'failed'
];
let ChatService = class ChatService {
    constructor(sessionRepository, messageRepository, socService) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.socService = socService;
        this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
    }
    getSpecificRecommendation(reason) {
        const lowerReason = reason.toLowerCase();
        if (lowerReason.includes('permanently blocked')) {
            return "This account is now permanently blocked. Review the source IP of the failed attempts for potential network-level blocking.";
        }
        const recommendations = [];
        if (lowerReason.includes('new country')) {
            recommendations.push("Confirm with the user if they are traveling or using a VPN. If not, immediate account lockout and password reset is advised.");
        }
        if (lowerReason.includes('new browser')) {
            recommendations.push("Verify with the user if they recently started using a new device or browser. If not, a password reset is recommended as a precaution.");
        }
        if (lowerReason.includes('unusual time')) {
            recommendations.push("Verify the legitimacy of this login with the user. If they don't recognize this activity, investigate further and consider a password reset.");
        }
        if (lowerReason.includes('ml model')) {
            recommendations.push("The AI model detected a deviation from normal behavior. A manual review of the user's session data is recommended to determine the nature of the anomaly.");
        }
        if (recommendations.length > 0) {
            // The \n ensures the list starts on a new line, making it a nested list.
            return "\n- " + recommendations.join('\n- ');
        }
        // Fallback for any other reason, though it should be rare with the current setup.
        return "A generic suspicious activity was detected. You should investigate this user's recent activity and consider temporarily disabling the account if the activity is confirmed to be malicious.";
    }
    isSecurityRelatedQuery(text) {
        const lowerText = text.toLowerCase();
        return SECURITY_KEYWORDS.some(keyword => lowerText.includes(keyword));
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
        // 1. Update the user's message
        messageToEdit.content = content;
        const updatedUserMessage = await this.messageRepository.save(messageToEdit);
        // 2. Find and delete subsequent messages in the session (the old bot response)
        const subsequentMessages = await this.messageRepository.find({
            where: {
                sessionId: messageToEdit.sessionId,
                id: (0, typeorm_2.MoreThan)(messageId),
            },
        });
        if (subsequentMessages.length > 0) {
            await this.messageRepository.remove(subsequentMessages);
        }
        // 3. Get the updated message history to send to the AI
        const fullHistory = await this.messageRepository.find({
            where: { sessionId: messageToEdit.sessionId },
            order: { createdAt: 'ASC' },
        });
        // 4. Re-generate bot response
        const newAssistantResponse = await this.chatWithGemini(content, userId, messageToEdit.sessionId, true);
        return {
            userMessage: updatedUserMessage,
            assistantResponse: newAssistantResponse.assistantMessage,
        };
    }
    async chatWithGemini(newMessageContent, userId, sessionId, isInternalCall = false) {
        var _a, _b, _c, _d, _e, _f, _g;
        let session;
        let messageHistory = [];
        if (sessionId) {
            const foundSession = await this.sessionRepository.findOne({ where: { id: sessionId } });
            if (!foundSession)
                throw new common_1.NotFoundException('Chat session not found');
            if (foundSession.userId !== userId)
                throw new common_1.UnauthorizedException('Access to this session is denied');
            session = foundSession;
            // Fetch existing messages for context
            messageHistory = await this.getMessagesForSession(sessionId, userId);
        }
        else {
            const title = newMessageContent.slice(0, 40) + (newMessageContent.length > 40 ? '...' : '');
            session = this.sessionRepository.create({ title, userId });
            await this.sessionRepository.save(session);
            // New session, so history is empty before this message
        }
        // For external calls (not from edit), save the new user message
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
            // For internal calls (from edit), just add the updated content to the history for context
            messageHistory.push({
                role: 'user',
                content: newMessageContent,
                sessionId: session.id,
                // id, createdAt etc. are not needed for the API call
            });
        }
        // --- This is the new, corrected logic ---
        const securityKeywords = ["suspicious", "anomaly", "alert", "threat", "report"];
        const isSecurityQuery = securityKeywords.some(keyword => newMessageContent.toLowerCase().includes(keyword));
        const isRecentQuery = newMessageContent.toLowerCase().includes('recent');
        if (isSecurityQuery) {
            // Use the injected service to get the summary
            const summary = await this.socService.getSuspiciousSummary(isRecentQuery ? 'recent' : '24-hour');
            const report = summary.summary.trim();
            const assistantMessage = this.messageRepository.create({
                role: 'assistant',
                content: report,
                sessionId: session.id
            });
            await this.messageRepository.save(assistantMessage);
            return { assistantMessage, sessionId: session.id };
        }
        // --- End of new logic ---
        // Prepare history for Gemini API
        const historyForApi = messageHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
        const conversationContext = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: GENERAL_PROMPT }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'Understood, I will proceed with the conversation as configured.' }]
                },
                ...historyForApi
            ]
        };
        try {
            console.log('Processing message:', newMessageContent);
            console.log('Security query:', isSecurityQuery);
            const response = await axios_1.default.post(`${this.geminiEndpoint}?key=${process.env.GEMINI_API_KEY}`, conversationContext, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const text = (_f = (_e = (_d = (_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text;
            console.log('Response received:', (text === null || text === void 0 ? void 0 : text.substring(0, 100)) + '...');
            const assistantResponse = text !== null && text !== void 0 ? text : 'No response from Gemini.';
            const assistantMessage = this.messageRepository.create({
                role: 'assistant',
                content: assistantResponse,
                sessionId: session.id,
            });
            await this.messageRepository.save(assistantMessage);
            return { assistantMessage, sessionId: session.id };
        }
        catch (error) {
            console.error('Gemini API error:', ((_g = error.response) === null || _g === void 0 ? void 0 : _g.data) || error.message);
            const assistantResponse = 'Error getting response from Gemini API.';
            const assistantMessage = this.messageRepository.create({ role: 'assistant', content: assistantResponse, sessionId: session.id });
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
