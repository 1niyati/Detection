# AI-Powered Security Chatbot System and login anomaly detection

A full-stack application featuring user authentication and an AI-powered chatbot for security-related assistance.

## 🌟 Features

- **User Authentication**
  - Secure login and signup
  - JWT-based authentication
  - Password hashing
  - Protected routes

- **AI Chatbot**
  - Natural language processing
  - Context-aware responses
  - Security-focused assistance
  - Real-time interaction

- **Security Dashboard**
  - User management
  - Activity monitoring
  - System analytics

## 🚀 Tech Stack

- **Frontend**:
  - Next.js 13+
  - TypeScript
  - Tailwind CSS
  - Radix UI
  - React Hook Form
  - SWR for data fetching

- **Backend (Chatbot System)**:
  - NestJS
  - TypeORM
  - PostgreSQL
  - JWT Authentication
  - OpenAI API Integration

**Backend (Detection/Anomaly System)**:
  - FastAPI (Python)
  - SQLAlchemy ORM
  - PostgreSQL
  - passlib (bcrypt) for password hashing
  - Pydantic for data validation
  - Machine Learning model (scikit-learn, joblib) for login anomaly detection

### Detection System Anomaly Detection Logic
- User-specific login time: Flags logins as unusual if the login hour is outside the user’s typical window (average ± max(2, 2×std deviation) of previous successful login hours).
- New IP/Browser: Flags if the login is from a new IP address or browser family.
- ML Model: A machine learning model analyzes login features for anomalies.
- Hybrid Decision: If the ML model or rule-based score is high, the login is flagged as an anomaly and the user is warned.

## 🛠️ Prerequisites

- Node.js 16+
- npm or yarn
- PostgreSQL
- OpenAI API key

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd final-chatbot-system
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run start:dev
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your configuration
npm install
npm run dev
```

### 4. Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@localhost:5432/chatbot_db
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
PORT=3001
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 Deployment

### Vercel (Frontend)

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Railway (Backend)

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add PostgreSQL database
4. Set environment variables
5. Deploy!

## 📚 API Documentation

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user profile

### Chat

- `POST /api/chat` - Send message to chatbot
- `GET /api/chat/history` - Get chat history

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for the powerful AI models
- Next.js and NestJS teams for amazing frameworks
- All contributors who helped improve this project

## 📧 Contact

For any inquiries, please reach out to [your-email@example.com](mailto:your-email@example.com)
