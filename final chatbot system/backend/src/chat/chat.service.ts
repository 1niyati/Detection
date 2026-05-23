import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { SocService } from '../soc/soc.service';

dotenv.config();

interface GeminiChatMessage {
  role: string;
  content: string;
}

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

@Injectable()
export class ChatService {
  private readonly geminiEndpoint =
   'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    private readonly socService: SocService,
  ) {}

  private getSpecificRecommendation(reason: string): string {
    const lowerReason = reason.toLowerCase();

    if (lowerReason.includes('permanently blocked')) {
      return 'This account is now permanently blocked. Review the source IP of the failed attempts for potential network-level blocking.';
    }

    const recommendations: string[] = [];

    if (lowerReason.includes('new country')) {
      recommendations.push(
        'Confirm with the user if they are traveling or using a VPN. If not, immediate account lockout and password reset is advised.',
      );
    }

    if (lowerReason.includes('new browser')) {
      recommendations.push(
        'Verify with the user if they recently started using a new device or browser. If not, a password reset is recommended as a precaution.',
      );
    }

    if (lowerReason.includes('unusual time')) {
      recommendations.push(
        "Verify the legitimacy of this login with the user. If they don't recognize this activity, investigate further and consider a password reset.",
      );
    }

    if (lowerReason.includes('ml model')) {
      recommendations.push(
        "The AI model detected a deviation from normal behavior. A manual review of the user's session data is recommended to determine the nature of the anomaly.",
      );
    }

    if (recommendations.length > 0) {
      return '\n- ' + recommendations.join('\n- ');
    }

    return "A generic suspicious activity was detected. You should investigate this user's recent activity and consider temporarily disabling the account if the activity is confirmed to be malicious.";
  }

  private isSecurityRelatedQuery(text: string): boolean {
    const lowerText = text.toLowerCase();
    return SECURITY_KEYWORDS.some((keyword) => lowerText.includes(keyword));
  }

  async getChatSessions(userId: number): Promise<ChatSession[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getMessagesForSession(sessionId: string, userId: number): Promise<ChatMessage[]> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId, userId } });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    return this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async deleteSession(sessionId: string, userId: number): Promise<{ message: string }> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId, userId } });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    await this.sessionRepository.remove(session);
    return { message: 'Chat session deleted successfully' };
  }

  async updateMessage(
    messageId: number,
    userId: number,
    content: string,
  ): Promise<{ userMessage: ChatMessage; assistantResponse: ChatMessage }> {
    const messageToEdit = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['session'],
    });

    if (!messageToEdit) throw new NotFoundException('Message not found');
    if (messageToEdit.session.userId !== userId)
      throw new UnauthorizedException('Permission denied');
    if (messageToEdit.role !== 'user')
      throw new UnauthorizedException('Can only edit user messages');

    messageToEdit.content = content;
    const updatedUserMessage = await this.messageRepository.save(messageToEdit);

    const subsequentMessages = await this.messageRepository.find({
      where: {
        sessionId: messageToEdit.sessionId,
        id: MoreThan(messageId),
      },
    });

    if (subsequentMessages.length > 0) {
      await this.messageRepository.remove(subsequentMessages);
    }

    const newAssistantResponse = await this.chatWithGemini(
      content,
      userId,
      messageToEdit.sessionId,
      true,
    );

    return {
      userMessage: updatedUserMessage,
      assistantResponse: newAssistantResponse.assistantMessage,
    };
  }

  async chatWithGemini(
    newMessageContent: string,
    userId: number,
    sessionId?: string,
    isInternalCall = false,
  ): Promise<{ assistantMessage: ChatMessage; sessionId: string }> {
    let session: ChatSession;
    let messageHistory: ChatMessage[] = [];

    if (sessionId) {
      const foundSession = await this.sessionRepository.findOne({ where: { id: sessionId } });
      if (!foundSession) throw new NotFoundException('Chat session not found');
      if (foundSession.userId !== userId)
        throw new UnauthorizedException('Access to this session is denied');

      session = foundSession;
      messageHistory = await this.getMessagesForSession(sessionId, userId);
    } else {
      const title =
        newMessageContent.slice(0, 40) + (newMessageContent.length > 40 ? '...' : '');
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
    } else {
      messageHistory.push({
        role: 'user',
        content: newMessageContent,
        sessionId: session.id,
      } as ChatMessage);
    }

    if (newMessageContent.toLowerCase().trim().includes('who are you')) {
      const introMessage =
        'I’m CyberBOT, your AI-powered SOC assistant. I help to provide you with recommendations, analyze login anomalies, and answer SOC-related questions.';

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
    const isSecurityQuery = securityKeywords.some((keyword) =>
      newMessageContent.toLowerCase().includes(keyword),
    );
    const isRecentQuery = newMessageContent.toLowerCase().includes('recent');

    if (isSecurityQuery) {
      const knownCategories = ['new ip address', 'new browser', 'unusual login time'];
      const foundCategory = knownCategories.find((cat) =>
        newMessageContent.toLowerCase().includes(cat),
      );

      const summary = await this.socService.getSuspiciousSummary(
        isRecentQuery ? 'recent' : '24-hour',
        foundCategory,
      );

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

      const response = await axios.post(
        `${this.geminiEndpoint}?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: conversationContext.contents,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const text =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';

      console.log('Response received:', text.substring(0, 100) + '...');

      const assistantMessage = this.messageRepository.create({
        role: 'assistant',
        content: text,
        sessionId: session.id,
      });

      await this.messageRepository.save(assistantMessage);

      return { assistantMessage, sessionId: session.id };
    } catch (error: any) {
      console.error('Gemini API error:', error.response?.data || error.message);
        let assistantResponse = 'Hello! I am CyberDefender AI, your SOC assistant. I can help you analyze security threats and login anomalies. Try asking me about suspicious activity, threats, anomalies, or alerts to get real-time security insights.';

if (error.response?.status === 404) {
  assistantResponse = 'Gemini model endpoint was not found. Please verify the configured model name.';
} else if (error.message?.includes('GEMINI_API_KEY is missing')) {
  assistantResponse = 'Gemini API key is missing. Add GEMINI_API_KEY to backend/.env and restart the backend.';
}
      if (error.response?.status === 400) {
        assistantResponse = 'Gemini request format was rejected. Please check the model and payload.';
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        assistantResponse =
          'Gemini API key is invalid, expired, or has no remaining quota. Please replace GEMINI_API_KEY in backend/.env.';
      } else if (error.response?.status === 404) {
        assistantResponse =
          'Gemini model endpoint was not found. Please verify the configured model name.';
      } else if (error.message?.includes('GEMINI_API_KEY is missing')) {
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
}