import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ChatInterface from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import { Settings, Download, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, Message } from "@shared/schema";

export default function ChatPage() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const { toast } = useToast();

  // Create new conversation on mount
  useEffect(() => {
    createNewConversation();
  }, []);

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Daily Planning Session",
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const conversation: Conversation = await response.json();
      setCurrentConversationId(conversation.id);
      
      toast({
        title: "New daily planning session started",
        description: "Let's help you organize your day!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start new conversation",
        variant: "destructive",
      });
    }
  };

  const exportConversation = async () => {
    if (!currentConversationId) return;

    try {
      const response = await fetch(`/api/conversations/${currentConversationId}`);
      if (!response.ok) throw new Error('Failed to fetch conversation');
      
      const data = await response.json();
      const exportData = {
        conversation: data.conversation,
        messages: data.messages,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${data.conversation.mode}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Conversation exported",
        description: "Your chat has been downloaded as a JSON file",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export conversation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">❤️</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Empathetic AI</h1>
                <p className="text-sm text-gray-500">Your Personal Support Assistant</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 gap-6 h-[calc(100vh-8rem)]">
          {currentConversationId && (
            <ChatInterface
              conversationId={currentConversationId}
              onNewConversation={createNewConversation}
            />
          )}
        </div>

        {/* Floating Actions */}
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <Button
            size="icon"
            className="bg-gradient-to-r from-secondary to-emerald-600 hover:shadow-xl transition-all"
            onClick={exportConversation}
            title="Export conversation"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="bg-gradient-to-r from-accent to-orange-500 hover:shadow-xl transition-all"
            title="Toggle dark mode"
          >
            <Moon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
