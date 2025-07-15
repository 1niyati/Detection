"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Copy, Edit, Paperclip, X } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { ChatHistorySidebar } from "./chat-history-sidebar";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";

interface Message {
  id?: number; // Make ID optional for new, optimistic messages
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
}

const API_URL = "http://localhost:3001";

// New component for rendering a single message with actions
const ChatMessage = ({ message, onCopy, onEdit }: { message: Message, onCopy: (text: string) => void, onEdit: (message: Message) => void }) => {
  const isUser = message.role === "user";

  const markdownComponents: Partial<Components> = {
      h2: ({children, ...props}: any) => <h2 className="text-lg font-bold mb-2 text-cyan-300" {...props}>{children}</h2>,
      strong: ({children, ...props}: any) => <strong className="text-cyan-300 font-semibold" {...props}>{children}</strong>,
      ul: ({children, ...props}: any) => <ul className="list-disc pl-4 space-y-2 my-2" {...props}>{children}</ul>,
      ol: ({children, ...props}: any) => <ol className="list-decimal pl-4 space-y-2 my-2" {...props}>{children}</ol>,
      li: ({children, ...props}: any) => <li className="mb-1" {...props}>{children}</li>,
      p: ({children, ...props}: any) => <p className="mb-2 last:mb-0 leading-relaxed" {...props}>{children}</p>,
      code: ({children, ...props}: any) => <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300" {...props}>{children}</code>,
  };

  return (
    <div className={`flex items-end gap-3 mb-5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isUser ? 'bg-blue-600' : 'bg-slate-600'}`}>
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
        </div>
      <div className={`p-4 rounded-lg max-w-[80%] shadow-md transition-colors ${isUser ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-100'}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        </div>
      <div className="flex items-center gap-1 self-center">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white transition-colors" onClick={() => onCopy(message.content)}><Copy className="w-4 h-4" /></Button>
        {isUser && <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white transition-colors" onClick={() => onEdit(message)}><Edit className="w-4 h-4" /></Button>}
      </div>
    </div>
  );
};


export function AIChatbot() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null); // New state for editing
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0 && !currentSessionId) {
          setCurrentSessionId(data[0].id);
        }
          }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
        }
  };

  const fetchMessages = async (sessionId: string) => {
    const token = getToken();
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
    } else {
      setMessages([]); // Clear messages if no session is selected
    }
  }, [currentSessionId]);
  
  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth' 
      });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const token = getToken();
    if (!token) return;

    const userMessageContent = input.trim();
    setInput("");
    
    // Optimistically add the user's message to the UI
    const optimisticMessage: Message = { 
      role: 'user', 
      content: userMessageContent 
    };
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    
    setIsLoading(true);

    // If we are editing, call the update endpoint
    if (editingMessage) {
    try {
        const res = await fetch(`${API_URL}/chat/messages/${editingMessage.id}`, {
          method: 'PATCH',
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: userMessageContent }),
        });
        if (!res.ok) throw new Error("Failed to update message");
        
        const { userMessage } = await res.json();
        await fetchMessages(userMessage.sessionId); // Refetch to get the new bot response

        setEditingMessage(null);

      } catch (err) {
        console.error("Error updating message", err);
        toast({ title: "Error", description: "Failed to update message.", variant: "destructive" });
        setInput(userMessageContent); // Restore input on failure
        setMessages(prev => prev.filter(m => m !== optimisticMessage)); // Remove optimistic message on failure
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Handle sending a new message
    try {
      const payload = {
        sessionId: currentSessionId,
        message: userMessageContent,
      };
      
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
      const data = await res.json();
        // After sending, refetch messages to get the new user and assistant messages with proper IDs
        await fetchMessages(data.sessionId);
        
        if (!currentSessionId) {
          await fetchSessions();
          setCurrentSessionId(data.sessionId);
        }
      } else {
        throw new Error("Failed to get response");
      }
    } catch (err) {
      console.error("Error sending message", err);
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
      setInput(userMessageContent); // Restore input on failure
      setMessages(prev => prev.filter(m => m !== optimisticMessage)); // Remove optimistic message on failure
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
  };

  const deleteSession = async (sessionId: string) => {
    const token = getToken();
    if (!token) return;

    try {
        await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: "Success", description: "Chat session deleted." });
        
        // Refetch sessions and reset view
        fetchSessions();
        if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
        }
    } catch (err) {
        console.error("Failed to delete session", err);
        toast({ title: "Error", description: "Could not delete session.", variant: "destructive"});
    }
  }
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Message copied to clipboard." });
  };
  
  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setInput(message.content);
  };
  
  const cancelEdit = () => {
    setEditingMessage(null);
    setInput("");
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFilesToUpload(Array.from(event.target.files));
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFilesToUpload(filesToUpload.filter(file => file !== fileToRemove));
  };

  return (
    <div className="h-full flex font-sans">
      <ChatHistorySidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
      />
      
      <div className="flex-1 flex flex-col bg-slate-800">
        <Card className="flex-1 bg-transparent border-0 flex flex-col rounded-none shadow-none">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-slate-200 flex items-center gap-3 text-lg font-semibold">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-700">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                  CyberBot AI Assistant
                <span className="text-xs text-slate-400 font-normal">Your AI-Powered SOC Co-pilot</span>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Welcome to CyberBot!</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                      I'm your AI assistant for cybersecurity analysis and threat detection. How can I help you today?
                    </p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <ChatMessage 
                    key={msg.id || `optimistic-${idx}`} 
                    message={msg}
                    onCopy={handleCopyToClipboard}
                    onEdit={handleEditMessage}
                  />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Bot className="w-4 h-4 animate-spin" />
                    CyberBot is thinking...
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-slate-700">
              {/* File Preview Area */}
              {filesToUpload.length > 0 && (
                <div className="p-2 mb-2 border border-dashed border-slate-600 rounded-lg">
                  <p className="text-xs text-slate-400 mb-2">Attachments:</p>
                  <div className="flex flex-wrap gap-2">
                    {filesToUpload.map((file, index) => (
                      <div key={index} className="relative bg-slate-700 p-2 rounded-md flex items-center gap-2">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt={file.name} className="w-10 h-10 object-cover rounded"/>
                        ) : (
                          <Paperclip className="w-8 h-8 text-slate-400"/>
                        )}
                        <span className="text-sm text-slate-300 truncate max-w-[150px]">{file.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 absolute -top-2 -right-2 bg-red-500/80 rounded-full" onClick={() => removeFile(file)}>
                          <X className="w-3 h-3"/>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative flex items-center">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  multiple 
                  className="hidden" 
                />
                <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-5 h-5"/>
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask me anything about cybersecurity..."
                  className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg text-base py-4 pl-12 pr-12"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  {editingMessage && (
                    <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-slate-400 hover:text-white">
                      Cancel
                    </Button>
                  )}
                <Button
                    onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                    className="bg-slate-600 hover:bg-slate-500"
                >
                    {editingMessage ? "Save" : <Send className="w-5 h-5" />}
                </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const runtime = "nodejs";
