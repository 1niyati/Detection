"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, MessageSquarePlus, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card" // Import the Card component

interface ChatSession {
  id: string
  title: string
  createdAt: Date
}

interface ChatHistorySidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSelectSession: (id: string) => void
  onNewChat: () => void
  onDeleteSession: (id: string) => void
}

export function ChatHistorySidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: ChatHistorySidebarProps) {
  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-700/60 flex flex-col font-sans">
      <div className="p-4 border-b border-slate-700/60 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-100">Chat History</h2>
        <Button variant="secondary" size="sm" onClick={onNewChat}>
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className={`group flex items-center justify-between p-3 cursor-pointer transition-colors border-slate-700
                ${
                  currentSessionId === session.id
                    ? "bg-blue-600/30 border-blue-500/50"
                    : "bg-slate-800/50 hover:bg-slate-700/50"
                }`}
              onClick={() => onSelectSession(session.id)}
            >
              <span className="truncate text-sm font-medium text-slate-200">{session.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
                    onDeleteSession(session.id);
                  }
                }}
                title="Delete chat session"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-slate-700/60 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
          <Bot className="w-4 h-4" />
          <span>SOC Copilot</span>
        </div>
    </div>
    </aside>
  )
} 