import { Controller, Post, Body, Get, UseGuards, Req, Param, Delete, Patch } from '@nestjs/common';
import { Request } from 'express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface ChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
}

interface UpdateMessageDto {
  content: string;
}

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
    role: string;
  };
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async chat(@Req() req: AuthenticatedRequest, @Body() body: { message: string, sessionId?: string }) {
    const userId = req.user.userId;
    const { message, sessionId } = body;
    // The service now takes the new message content directly
    return this.chatService.chatWithGemini(message, userId, sessionId);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.chatService.getChatSessions(userId);
  }

  @Get('sessions/:sessionId/messages')
  @UseGuards(JwtAuthGuard)
  async getMessages(@Req() req: AuthenticatedRequest, @Param('sessionId') sessionId: string) {
    const userId = req.user.userId;
    return this.chatService.getMessagesForSession(sessionId, userId);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  async deleteSession(@Req() req: AuthenticatedRequest, @Param('sessionId') sessionId: string) {
    const userId = req.user.userId;
    return this.chatService.deleteSession(sessionId, userId);
  }

  @Patch('messages/:messageId')
  @UseGuards(JwtAuthGuard)
  async updateMessage(
    @Req() req: AuthenticatedRequest,
    @Param('messageId') messageId: number,
    @Body() body: UpdateMessageDto,
  ) {
    const userId = req.user.userId;
    // This now returns an object with the updated user message and new assistant response
    return this.chatService.updateMessage(messageId, userId, body.content);
  }
}
