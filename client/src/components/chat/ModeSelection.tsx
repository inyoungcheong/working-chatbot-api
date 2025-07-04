import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

const chatModes = [
  {
    id: 'greeting',
    title: 'Greeting',
    description: 'Warm welcome & introduction',
    icon: '👋',
    bgClass: 'bg-gradient-to-r from-primary to-purple-600'
  },
  {
    id: 'declutter',
    title: 'Declutter',
    description: 'Organize thoughts & priorities',
    icon: '🧹',
    bgClass: 'bg-gradient-to-r from-secondary to-emerald-600'
  },
  {
    id: 'bite_size',
    title: 'Bite Size',
    description: 'Break down complex tasks',
    icon: '🧩',
    bgClass: 'bg-gradient-to-r from-accent to-orange-500'
  },
  {
    id: 'daily_tasks',
    title: 'Daily Tasks',
    description: 'Plan your day effectively',
    icon: '📅',
    bgClass: 'bg-gradient-to-r from-primary to-purple-600'
  },
  {
    id: 'rewards',
    title: 'Rewards',
    description: 'Celebrate achievements',
    icon: '🏆',
    bgClass: 'bg-gradient-to-r from-accent to-orange-500'
  },
  {
    id: 'report',
    title: 'Report',
    description: 'Progress insights & summary',
    icon: '📊',
    bgClass: 'bg-gradient-to-r from-secondary to-emerald-600'
  }
];

interface ModeSelectionProps {
  selectedMode: string;
  onModeChange: (mode: string) => void;
  onNewConversation: () => void;
}

export default function ModeSelection({ selectedMode, onModeChange, onNewConversation }: ModeSelectionProps) {
  return (
    <Card className="lg:col-span-1 h-fit">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🎨</span>
          Chat Modes
        </h2>
        
        <div className="space-y-3">
          {chatModes.map((mode) => (
            <div
              key={mode.id}
              className={`p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
                selectedMode === mode.id
                  ? `${mode.bgClass} text-white shadow-md`
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => onModeChange(mode.id)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{mode.icon}</span>
                <div>
                  <h3 className={`font-medium ${selectedMode === mode.id ? 'text-white' : 'text-gray-900'}`}>
                    {mode.title}
                  </h3>
                  <p className={`text-sm ${selectedMode === mode.id ? 'text-white/90' : 'text-gray-600'}`}>
                    {mode.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500 mb-2">Quick Actions</div>
          <Button 
            className="w-full bg-gradient-to-r from-secondary to-emerald-600 hover:shadow-md transition-all"
            onClick={onNewConversation}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            New Conversation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
