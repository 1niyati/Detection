// app/api/chat/route.ts

import { NextRequest } from "next/server"
import axios from "axios"

export const runtime = "nodejs"

const GENERAL_PROMPT = `You are a friendly and helpful AI assistant. Engage in natural conversation while being helpful and concise. For greetings like "hello" or "hi", respond naturally as a friendly assistant would. Keep responses conversational yet professional.

Example:
User: Hello
Assistant: Hi there! How can I help you today?

User: How are you?
Assistant: I'm doing well, thank you for asking! How can I assist you today?
`.trim()

const SECURITY_PROMPT = `
You are CyberBot, an advanced AI Security Assistant in SENTINEL SOC. 
You are designed to:
- Detect login anomalies and suspicious behavior
- Classify threats as High, Medium, or Low risk
- Suggest security mitigation steps
- Recommend best practices for incident response

Always be concise, use technical language, and provide direct security advice. Avoid marketing or generic business responses.
`.trim()

// Keywords that indicate a security-related query
const SECURITY_KEYWORDS = [
  'security', 'hack', 'vulnerability', 'threat', 'malware', 'virus',
  'breach', 'attack', 'firewall', 'encryption', 'password', 'authentication',
  'exploit', 'cybersecurity', 'phishing', 'ransomware', 'incident'
]

function isSecurityRelatedQuery(text: string): boolean {
  const lowerText = text.toLowerCase()
  return SECURITY_KEYWORDS.some(keyword => lowerText.includes(keyword))
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Forward to backend
    const backendRes = await axios.post(
      'http://localhost:3001/chat', // Make sure this matches your backend port
      { messages },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    return new Response(
      JSON.stringify({
        id: Date.now().toString(),
        role: "assistant",
        content: backendRes.data.text
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (err: any) {
    console.error("Chat API Error:", err.response?.data || err.message)
    return new Response(JSON.stringify({ error: "Error connecting to chat service" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
