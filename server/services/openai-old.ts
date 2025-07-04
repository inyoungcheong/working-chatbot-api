// Using Together AI for chat completions
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || "your-api-key";
const TOGETHER_BASE_URL = "https://api.together.xyz/v1";

export type ConversationPhase = 'motivation_quote' | 'daunting_tasks' | 'fears_excitements' | 'examine_fears' | 'current_progress' | 'bite_size_planning' | 'task_editing' | 'excitement_discussion';

// Dynamic conversation approach - responds naturally to user input while maintaining therapeutic structure
const conversationGuidelines = {
  opening: {
    goal: "Start with motivation and understand their situation",
    approach: `Start with a brief inspiring quote about overcoming creative challenges, then ask what's on their mind today. 
    
    Listen to their response and respond naturally - don't just jump to the next predetermined question. If they mention specific struggles, acknowledge them. If they seem overwhelmed, offer empathy. If they're ready to dive in, match their energy.
    
    Keep your initial response warm, encouraging, and under 100 words.`
  },
  
  exploration: {
    goal: "Understand what they're dealing with and how they feel about it",
    approach: `Based on what they've shared, naturally explore their situation. This might involve:
    - Understanding what tasks feel overwhelming and why
    - Exploring both fears and excitement about their work
    - Acknowledging their feelings before moving forward
    
    Ask follow-up questions that show you're listening. Don't rush through a checklist - have a real conversation.`
  },
  
  examination: {
    goal: "Help them examine their thoughts using CBT principles",
    approach: `When they share fears or concerns, gently help them examine these thoughts:
    - Are these fears realistic or based on assumptions?
    - What evidence supports or contradicts these worries?
    - Are they thinking in black-and-white terms?
    
    Ask thoughtful questions based on what they've actually said, not generic prompts. Show that you're listening by referencing their specific words.`
  },
  
  planning: {
    goal: "Break down their work into manageable steps",
    approach: `Once you understand their situation and they've worked through some mental barriers, help create a practical plan:
    - Ask about their current progress and what remains
    - Break their work into 6 realistic 30-minute tasks
    - Base tasks specifically on what they've told you
    - Make tasks feel achievable and connected to their goals
    
    Present the plan as a collaborative effort, not a prescription.`
  },
  
  refinement: {
    goal: "Let them adjust the plan and connect with positive feelings",
    approach: `Give them full control to modify the plan:
    - Ask if the tasks feel right for them
    - Encourage changes that suit their style and energy
    - Help them reconnect with what excites them about the work
    - End on an encouraging, forward-looking note
    
    This should feel like you're their thought partner, not their instructor.`
  }
};

function determineConversationStage(
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
): string {
  const messageCount = conversationHistory.length;
  const userMessages = conversationHistory.filter(msg => msg.role === 'user');
  const lastUserMessage = userMessages[userMessages.length - 1]?.content.toLowerCase() || '';
  
  // Analyze conversation content to determine appropriate stage
  if (messageCount === 0) {
    return 'opening';
  }
  
  const hasSharedTasks = userMessages.some(msg => 
    msg.content.toLowerCase().includes('task') || 
    msg.content.toLowerCase().includes('work') ||
    msg.content.toLowerCase().includes('project') ||
    msg.content.toLowerCase().includes('write') ||
    msg.content.toLowerCase().includes('chapter')
  );
  
  const hasSharedFears = userMessages.some(msg => 
    msg.content.toLowerCase().includes('fear') || 
    msg.content.toLowerCase().includes('worry') ||
    msg.content.toLowerCase().includes('anxious') ||
    msg.content.toLowerCase().includes('overwhelm') ||
    msg.content.toLowerCase().includes('scared')
  );
  
  const hasSharedProgress = userMessages.some(msg => 
    msg.content.toLowerCase().includes('done') || 
    msg.content.toLowerCase().includes('finish') ||
    msg.content.toLowerCase().includes('complete') ||
    msg.content.toLowerCase().includes('start') ||
    msg.content.toLowerCase().includes('progress')
  );
  
  const wantsTaskBreakdown = lastUserMessage.includes('task') || 
    lastUserMessage.includes('plan') ||
    lastUserMessage.includes('break') ||
    lastUserMessage.includes('step') ||
    (hasSharedTasks && hasSharedFears && userMessages.length >= 3);
  
  const wantsToEdit = lastUserMessage.includes('edit') ||
    lastUserMessage.includes('change') ||
    lastUserMessage.includes('adjust') ||
    lastUserMessage.includes('modify');
  
  // Dynamic stage determination based on conversation content
  if (!hasSharedTasks && messageCount < 4) {
    return 'exploration';
  }
  
  if (hasSharedTasks && hasSharedFears && !wantsTaskBreakdown && messageCount < 8) {
    return 'examination';
  }
  
  if (wantsTaskBreakdown || (hasSharedTasks && hasSharedProgress)) {
    return 'planning';
  }
  
  if (wantsToEdit || messageCount > 8) {
    return 'refinement';
  }
  
  return 'exploration';
}

export async function generateChatResponse(
  currentPhase: ConversationPhase | null,
  userMessage: string, 
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
): Promise<{ response: string; nextPhase: ConversationPhase }> {
  try {
    // Determine which phase we should be in
    const phase = determineNextPhase(currentPhase, conversationHistory);
    const phaseConfig = conversationFlow[phase];
    
    // Build conversation context
    let systemPrompt = phaseConfig.prompt;
    
    // Add context from previous phases if we have history
    if (conversationHistory.length > 0) {
      systemPrompt += `\n\nContext from our conversation: You've been helping this person through their daily planning journey. Continue naturally from where you left off, guiding them toward the next step.`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: userMessage }
    ];

    const response = await fetch(`${TOGETHER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3-8b-chat-hf",
        messages,
        max_tokens: 350,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Together AI API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "I apologize, but I'm having trouble responding right now. Please try again.";
    
    return {
      response: aiResponse,
      nextPhase: phase
    };
  } catch (error) {
    console.error("Together AI API error:", error);
    throw new Error("Failed to generate response. Please check your API key and try again.");
  }
}

export const chatModes = [
  {
    id: 'greeting' as const,
    title: 'Greeting',
    description: 'Warm welcome & introduction',
    icon: 'fa-hand-wave',
    color: 'from-primary to-purple-600'
  },
  {
    id: 'declutter' as const,
    title: 'Declutter',
    description: 'Organize thoughts & priorities',
    icon: 'fa-broom',
    color: 'from-secondary to-emerald-600'
  },
  {
    id: 'bite_size' as const,
    title: 'Bite Size',
    description: 'Break down complex tasks',
    icon: 'fa-puzzle-piece',
    color: 'from-accent to-orange-500'
  },
  {
    id: 'daily_tasks' as const,
    title: 'Daily Tasks',
    description: 'Plan your day effectively',
    icon: 'fa-calendar-check',
    color: 'from-primary to-purple-600'
  },
  {
    id: 'rewards' as const,
    title: 'Rewards',
    description: 'Celebrate achievements',
    icon: 'fa-trophy',
    color: 'from-accent to-orange-500'
  },
  {
    id: 'report' as const,
    title: 'Report',
    description: 'Progress insights & summary',
    icon: 'fa-chart-line',
    color: 'from-secondary to-emerald-600'
  }
];
