import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';

dotenv.config();

interface GeminiChatMessage {
  role: string;
  content: string;
}

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
  'suspicious', 'compromise', 'unauthorized', 'detection', 'logins', 'anomaly'
];

@Injectable()
export class ChatService {
  private readonly geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
  ) {}

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
    }
    
    // Handle special alert query using only the new message
    if (newMessageContent.toLowerCase().includes('suspicious') || newMessageContent.toLowerCase().includes('anomaly') || newMessageContent.toLowerCase().includes('alert')) {
      try {
        console.log('Fetching suspicious login alerts...');
        const alertResponse = await axios.get('http://localhost:8000/auth/alerts/suspicious-logins');
        const alerts = alertResponse.data;

        let report: string;
        if (alerts && alerts.length > 0) {
          report = `## Suspicious Login Report\n\nI have detected ${alerts.length} suspicious login attempt(s). Here are the details:\n\n`;
          alerts.forEach((alert: any, index: number) => {
            report += `### Alert ${index + 1}\n`;
            report += `- **User Email:** ${alert.email}\n`;
            report += `- **Time:** ${new Date(alert.timestamp).toLocaleString()}\n`;
            report += `- **Risk Level:** ${alert.risk_level}\n`;
            report += `- **Reason:** ${alert.reason}\n`;
            report += `**Recommendation:** You should investigate this user's recent activity and consider temporarily disabling the account if the activity is confirmed to be malicious.\n\n`;
          });
        } else {
          report = "I have not detected any suspicious login activity at this time.";
        }
        
        const assistantMessage = this.messageRepository.create({ role: 'assistant', content: report, sessionId: session.id });
        await this.messageRepository.save(assistantMessage);
        return { assistantMessage, sessionId: session.id };

      } catch (error) {
        console.error('Error fetching login alerts:', error);
        const errorResponse = "I was unable to retrieve the latest security alerts from the detection system. Please check if the system is running.";
        const assistantMessage = this.messageRepository.create({ role: 'assistant', content: errorResponse, sessionId: session.id });
        await this.messageRepository.save(assistantMessage);
        return { assistantMessage, sessionId: session.id };
      }
    }

    // --- Standard Gemini call ---
    const isSecurityQuery = this.isSecurityRelatedQuery(newMessageContent);
    const systemPrompt = isSecurityQuery ? SECURITY_PROMPT : GENERAL_PROMPT;

    const conversationContext = {
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'Understood, I will proceed with the conversation as configured.' }]
        },
        ...messageHistory.map((msg) => ({ // Use the constructed message history
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
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
