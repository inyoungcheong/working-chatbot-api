import { formatDistanceToNow } from "date-fns";
import type { Message } from "@shared/schema";

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
}

export default function MessageBubble({ message, isUser }: MessageBubbleProps) {
  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

  return (
    <div className={`flex items-start space-x-3 animate-fade-in ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs">❤️</span>
        </div>
      )}
      
      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`p-4 rounded-2xl max-w-xs lg:max-w-md ${
            isUser
              ? 'bg-gradient-to-r from-primary to-purple-600 text-white rounded-tr-md ml-auto'
              : 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-gray-800 rounded-tl-md'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          <span className={`text-xs mt-2 block ${isUser ? 'text-white/80' : 'text-gray-500'}`}>
            {timeAgo}
          </span>
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-accent to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs">👤</span>
        </div>
      )}
    </div>
  );
}
