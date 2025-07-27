import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { SocService } from '../soc/soc.service'; // Import SocService

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
  'security', 'hack', 'vulnerability', 'threat', 'malware', 'virus',
  'breach', 'attack', 'firewall', 'encryption', 'password', 'authentication',
  'exploit', 'cybersecurity', 'phishing', 'ransomware', 'incident', 'alert',
  'suspicious', 'compromise', 'unauthorized', 'detection', 'logins', 'anomaly', 'attempt', 'failed'
];

@Injectable()
export class ChatService {
  private readonly geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    private readonly socService: SocService, // Inject SocService
  ) {}

  private getSpecificRecommendation(reason: string): string {
    const lowerReason = reason.toLowerCase();
    
    if (lowerReason.includes('permanently blocked')) {
        return "This account is now permanently blocked. Review the source IP of the failed attempts for potential network-level blocking.";
    }
    
    const recommendations: string[] = [];

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

  private isSecurityRelatedQuery(text: string): boolean {
    const lowerText = text.toLowerCase();
    return SECURITY_KEYWORDS.some(keyword => lowerText.includes(keyword));
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
    if (messageToEdit.session.userId !== userId) throw new UnauthorizedException('Permission denied');
    if (messageToEdit.role !== 'user') throw new UnauthorizedException('Can only edit user messages');

    // 1. Update the user's message
    messageToEdit.content = content;
    const updatedUserMessage = await this.messageRepository.save(messageToEdit);

    // 2. Find and delete subsequent messages in the session (the old bot response)
    const subsequentMessages = await this.messageRepository.find({
      where: {
        sessionId: messageToEdit.sessionId,
        id: MoreThan(messageId),
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

  async chatWithGemini(
    newMessageContent: string,
    userId: number,
    sessionId?: string,
    isInternalCall = false, // This helps differentiate from the edit flow
  ): Promise<{ assistantMessage: ChatMessage; sessionId: string }> {
    let session: ChatSession;
    let messageHistory: ChatMessage[] = [];

    if (sessionId) {
      const foundSession = await this.sessionRepository.findOne({ where: { id: sessionId } });
      if (!foundSession) throw new NotFoundException('Chat session not found');
      if (foundSession.userId !== userId) throw new UnauthorizedException('Access to this session is denied');
      session = foundSession;
      // Fetch existing messages for context
      messageHistory = await this.getMessagesForSession(sessionId, userId);
    } else {
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
    } else {
      // For internal calls (from edit), just add the updated content to the history for context
      messageHistory.push({
        role: 'user',
        content: newMessageContent,
        sessionId: session.id,
        // id, createdAt etc. are not needed for the API call
      } as ChatMessage);
    }
    
    // Handle the "who are you" query specifically
    if (newMessageContent.toLowerCase().trim().includes('who are you')) {
      const introMessage = "I’m CyberBOT, your AI-powered SOC assistant. I help to provide you with recommendations, analyze login anomalies, and answer SOC-related questions.";
      
      const assistantMessage = this.messageRepository.create({ 
        role: 'assistant', 
        content: introMessage, 
        sessionId: session.id 
      });

      await this.messageRepository.save(assistantMessage);
      return { assistantMessage, sessionId: session.id };
    }

    // --- This is the new, corrected logic ---
    const securityKeywords = ["suspicious", "anomaly", "alert", "threat", "report"];
    const isSecurityQuery = securityKeywords.some(keyword => newMessageContent.toLowerCase().includes(keyword));
    const isRecentQuery = newMessageContent.toLowerCase().includes('recent');

    if (isSecurityQuery) {
        // --- New category detection logic ---
        const knownCategories = ["new ip address", "new browser", "unusual login time"];
        const foundCategory = knownCategories.find(cat => newMessageContent.toLowerCase().includes(cat));

        // Use the injected service to get the summary, now with category support
        const summary = await this.socService.getSuspiciousSummary(
          isRecentQuery ? 'recent' : '24-hour',
          foundCategory
        );
      
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

      const response = await axios.post(
        `${this.geminiEndpoint}?key=${process.env.GEMINI_API_KEY}`,
        conversationContext,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('Response received:', text?.substring(0, 100) + '...');
      
      const assistantResponse = text ?? 'No response from Gemini.';
      const assistantMessage = this.messageRepository.create({
        role: 'assistant',
        content: assistantResponse,
        sessionId: session.id,
      });
      await this.messageRepository.save(assistantMessage);

      return { assistantMessage, sessionId: session.id };
    } catch (error: any) {
      console.error('Gemini API error:', error.response?.data || error.message);
      const assistantResponse = 'Error getting response from Gemini API.';
      const assistantMessage = this.messageRepository.create({ role: 'assistant', content: assistantResponse, sessionId: session.id });
      await this.messageRepository.save(assistantMessage);
      return { assistantMessage, sessionId: session.id };
    }
  }
}
