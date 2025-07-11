"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const user_entity_1 = require("../auth/entities/user.entity");
const chat_session_entity_1 = require("../chat/entities/chat-session.entity");
const chat_message_entity_1 = require("../chat/entities/chat-message.entity");
exports.databaseConfig = {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'abc',
    database: 'Chatbot',
    entities: [user_entity_1.User, chat_session_entity_1.ChatSession, chat_message_entity_1.ChatMessage],
    synchronize: true,
    logging: true,
};
