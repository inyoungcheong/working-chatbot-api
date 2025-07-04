// Using Together AI for chat completions
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || "your-api-key";
const TOGETHER_BASE_URL = "https://api.together.xyz/v1";

export type ConversationPhase = 'motivation_quote' | 'daunting_tasks' | 'fears_excitements' | 'examine_fears' | 'current_progress' | 'bite_size_planning' | 'task_editing' | 'excitement_discussion';

function analyzeConversationStage(
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
): string {
  const userMessages = conversationHistory.filter(msg => msg.role === 'user');
  const allUserText = userMessages.map(msg => msg.content.toLowerCase()).join(' ');
  
  // If just starting
  if (userMessages.length === 0) {
    return 'opening';
  }
  
  // Look for specific cues in what they've said
  const mentionedTasks = allUserText.includes('task') || allUserText.includes('work') || 
                        allUserText.includes('project') || allUserText.includes('write') ||
                        allUserText.includes('chapter') || allUserText.includes('deadline');
  
  const mentionedFears = allUserText.includes('fear') || allUserText.includes('worry') ||
                        allUserText.includes('anxious') || allUserText.includes('overwhelm') ||
                        allUserText.includes('scared') || allUserText.includes('difficult');
  
  const mentionedProgress = allUserText.includes('done') || allUserText.includes('started') ||
                           allUserText.includes('finish') || allUserText.includes('complete');
  
  const lastMessage = userMessages[userMessages.length - 1]?.content.toLowerCase() || '';
  
  const wantsBreakdown = lastMessage.includes('break') || lastMessage.includes('step') ||
                        lastMessage.includes('plan') || lastMessage.includes('how');
  
  const wantsToEdit = lastMessage.includes('edit') || lastMessage.includes('change') ||
                     lastMessage.includes('adjust') || lastMessage.includes('different');
  
  // Natural progression based on what they've shared
  if (wantsToEdit && mentionedTasks) {
    return 'refinement';
  }
  
  if (wantsBreakdown) {
    return 'planning';
  }
  
  // Give more space for examination before jumping to planning
  if (mentionedTasks && mentionedFears && userMessages.length >= 4) {
    return 'planning';
  }
  
  if (mentionedTasks && mentionedFears && userMessages.length >= 2) {
    return 'examination';
  }
  
  if (mentionedTasks || userMessages.length >= 2) {
    return 'exploration';
  }
  
  return 'opening';
}

export async function generateChatResponse(
  currentPhase: ConversationPhase | null,
  userMessage: string, 
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
): Promise<{ response: string; nextPhase: ConversationPhase }> {
  try {
    const stage = analyzeConversationStage(conversationHistory);
    
    // Create natural, conversational system prompts based on stage
    let systemPrompt = "";
    
    switch (stage) {
      case 'opening':
        systemPrompt = `You are a warm, empathetic daily planning assistant. Start with a brief inspiring quote about overcoming creative challenges or writer's block. Then ask them what's on their mind today or what they're working on. 

Listen carefully to their response and respond naturally. If they seem overwhelmed, offer empathy. If they're excited, match their energy. Keep it conversational and under 100 words.`;
        break;
        
      case 'exploration':
        systemPrompt = `Continue the conversation naturally based on what they've shared. Ask follow-up questions about their tasks or situation. Show you're listening by referencing their specific words. 

You might explore:
- What exactly feels challenging about their work
- What their goals are for today
- How they're feeling about their tasks
- What's been on their mind

Be genuinely curious and conversational. Don't rush to solutions - just understand their situation first.`;
        break;
        
      case 'examination':
        systemPrompt = `They've shared both tasks and concerns. Now gently help them examine their thoughts using CBT principles. Ask thoughtful questions based on what they've actually said:

- Reference their specific fears or worries
- Ask if these concerns are based on realistic assumptions
- Help them see if they're thinking in black-and-white terms
- Ask what evidence supports or contradicts their worries

Be gentle and use their exact words. Don't lecture - guide them to their own insights through questions.`;
        break;
        
      case 'planning':
        systemPrompt = `They're ready for practical planning. Based on everything they've shared, help break down their work into manageable steps:

1. First ask about their current progress
2. Then create 6 specific, realistic tasks that take about 30 minutes each
3. Base these directly on what they've told you about their situation
4. Make each task feel achievable and connected to their goals

Present this as a collaborative plan, not a prescription. Show how it builds on what they've shared.`;
        break;
        
      case 'refinement':
        systemPrompt = `They want to adjust the plan or you're wrapping up. Focus on:

- Letting them modify tasks to fit their style
- Helping them reconnect with what excites them about the work
- Offering encouragement for moving forward
- Asking if anything feels off about the plan

Give them full control and end on a positive, supportive note. This should feel collaborative.`;
        break;
        
      default:
        systemPrompt = `Have a natural, supportive conversation about their daily planning needs. Listen carefully and respond to what they actually say.`;
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
        max_tokens: 300,
        temperature: 0.8,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Together AI API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "I apologize, but I'm having trouble responding right now. Please try again.";
    
    // Map conversation stage back to phase for storage
    let nextPhase: ConversationPhase;
    switch (stage) {
      case 'opening':
        nextPhase = 'motivation_quote';
        break;
      case 'exploration':
        nextPhase = 'daunting_tasks';
        break;
      case 'examination':
        nextPhase = 'examine_fears';
        break;
      case 'planning':
        nextPhase = 'bite_size_planning';
        break;
      case 'refinement':
        nextPhase = 'excitement_discussion';
        break;
      default:
        nextPhase = 'motivation_quote';
    }
    
    return {
      response: aiResponse,
      nextPhase
    };
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate response');
  }
}

export const chatModes = [
  { id: 'planning', name: 'Daily Planning', description: 'Empathetic planning support' }
];