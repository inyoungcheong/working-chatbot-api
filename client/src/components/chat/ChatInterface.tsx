import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { useToast } from "@/hooks/use-toast";
import type { Message, Conversation } from "@shared/schema";

interface ChatInterfaceProps {
  conversationId: number;
  onNewConversation: () => void;
}

export default function ChatInterface({ conversationId, onNewConversation }: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const quickActions = [
    "😊 I'm feeling good",
    "📝 Help me plan",
    "🎯 Break down task"
  ];

  // Fetch conversation with messages
  const { data: conversationData, isLoading } = useQuery({
    queryKey: [`/api/conversations/${conversationId}`],
    enabled: !!conversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }

      return response.json();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}`] });
      setInputMessage('');
      setIsTyping(false);
      toast({
        title: "Message sent",
        description: "Your message has been processed",
      });
    },
    onError: (error: Error) => {
      setIsTyping(false);
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    const content = inputMessage.trim();
    if (!content) return;

    sendMessageMutation.mutate({ content });
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [(conversationData as any)?.messages, isTyping]);

  if (isLoading) {
    return (
      <Card className="lg:col-span-3 flex items-center justify-center">
        <CardContent>
          <div className="text-center text-gray-500">Loading conversation...</div>
        </CardContent>
      </Card>
    );
  }

  const conversation: Conversation = (conversationData as any)?.conversation;
  const messages: Message[] = (conversationData as any)?.messages || [];

  const getPhaseInfo = (phase: string) => {
    const phaseMap: Record<string, { title: string; description: string; icon: string }> = {
      motivation_quote: { title: 'Daily Motivation', description: 'Starting with inspiration and encouragement', icon: '✨' },
      daunting_tasks: { title: 'Identifying Challenges', description: 'What feels overwhelming today?', icon: '🎯' },
      fears_excitements: { title: 'Exploring Feelings', description: 'Understanding your fears and excitements', icon: '💭' },
      examine_fears: { title: 'Examining Thoughts', description: 'Taking a closer look at our assumptions', icon: '🔍' },
      current_progress: { title: 'Current Progress', description: 'Where are you now with your tasks?', icon: '📍' },
      bite_size_planning: { title: 'Bite-Size Planning', description: 'Breaking everything into manageable steps', icon: '🧩' },
      task_editing: { title: 'Task Editing', description: 'Adjusting your plan to fit perfectly', icon: '✏️' },
      excitement_discussion: { title: 'Embracing Excitement', description: 'Connecting with what energizes you', icon: '🌟' },
    };
    return phaseMap[phase] || phaseMap.motivation_quote;
  };

  const phaseInfo = getPhaseInfo(conversation?.currentPhase || 'motivation_quote');

  return (
    <Card className="lg:col-span-3 flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-primary to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl">{phaseInfo.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{phaseInfo.title}</h3>
              <p className="text-sm opacity-90">{phaseInfo.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={onNewConversation}
            >
              New Session
            </Button>
            <div className="flex items-center space-x-2 text-sm opacity-90">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <span className="text-4xl mb-4 block">{phaseInfo.icon}</span>
            <h3 className="text-lg font-medium mb-2">Welcome to {phaseInfo.title}</h3>
            <p className="text-sm">{phaseInfo.description}</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isUser={message.role === 'user'}
          />
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-6">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={2}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {inputMessage.length}/500
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sendMessageMutation.isPending}
            className="bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg transition-all px-6 py-4"
          >
            <Send className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2 mt-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1 hover:bg-gray-100 transition-colors"
              onClick={() => handleQuickAction(action)}
            >
              {action}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
