import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module'; // Import AdminModule
import { ChatSession } from './chat/entities/chat-session.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';
import { User } from './auth/entities/user.entity';
import { SocModule } from './soc/soc.module';
import { LoginActivity } from './soc/entities/login-activity.entity';
import { SocUser } from './soc/entities/soc-user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Default Connection
    TypeOrmModule.forRootAsync({
      name: 'default',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [ChatSession, ChatMessage, User],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    // Second connection for 'application' database
    TypeOrmModule.forRootAsync({
      name: 'applicationConnection',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: 'application',
        entities: [LoginActivity, SocUser],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ChatModule,
    AdminModule,
    SocModule, // Add AdminModule here
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
