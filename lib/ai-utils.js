/ 5. lib/ai-utils.js (새로 생성 - AI 로직 분리)
export function analyzeConversationStage(conversationHistory) {
  const userMessages = conversationHistory.filter(msg => msg.role === 'user');
  const allUserText = userMessages.map(msg => msg.content.toLowerCase()).join(' ');
  
  if (userMessages.length === 0) return 'opening';
  
  const mentionedTasks = allUserText.includes('task') || allUserText.includes('work') || 
                        allUserText.includes('project') || allUserText.includes('write') || 
                        allUserText.includes('chapter') || allUserText.includes('deadline');
  const mentionedFears = allUserText.includes('fear') || allUserText.includes('worry') || 
                        allUserText.includes('anxious') || allUserText.includes('overwhelm') || 
                        allUserText.includes('scared') || allUserText.includes('difficult');
  
  const lastMessage = userMessages[userMessages.length - 1]?.content.toLowerCase() || '';
  const wantsBreakdown = lastMessage.includes('break') || lastMessage.includes('step') || 
                        lastMessage.includes('plan') || lastMessage.includes('how');
  
  if (wantsBreakdown) return 'planning';
  if (mentionedTasks && mentionedFears && userMessages.length >= 4) return 'planning';
  if (mentionedTasks && mentionedFears && userMessages.length >= 2) return 'examination';
  if (mentionedTasks || userMessages.length >= 2) return 'exploration';
  
  return 'opening';
}

export async function generateResponse(conversationHistory, userMessage) {
  const API_KEY = process.env.API_KEY;
  const PRINCETON_ENDPOINT = "https://api-ai-sandbox.princeton.edu/";
  const MODEL_NAME = "gpt-4o"; // 좋은 GPT 버전 사용
  
  if (!API_KEY) {
    throw new Error('API key must be configured');
  }

  const stage = analyzeConversationStage(conversationHistory);
  
  let systemPrompt = '';
  switch (stage) {
    case 'opening':
      systemPrompt = `You are a warm, empathetic daily planning assistant. Start with a brief inspiring and not too obvious quote about overcoming creative challenges. Then ask them what's on their mind today. Keep it conversational and under 150 words.`;
      break;
    case 'exploration':
      systemPrompt = `Continue the conversation naturally. Ask follow-up questions about their tasks or situation. Show you're listening by referencing their specific words. Be genuinely curious and conversational.`;
      break;
    case 'examination':
      systemPrompt = `They've shared both tasks and concerns. Now gently help them examine their thoughts. Ask thoughtful questions about their specific fears or worries. Help them see if concerns are realistic.`;
      break;
    case 'planning':
      systemPrompt = `They're ready for practical planning. Gently push them to name the three main tasks to accomplish in next couple hours. If they struggle, suggest your ideas about how to break down their work into specific, bite-sized tasks. Base these directly on what they've told you. Be concise, focusing on actionable items and keep it under 200 words.`;
      break;
    default:
      systemPrompt = `Have a natural, supportive conversation about their daily planning needs. Listen carefully and respond to what they actually say.`;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-8),
    { role: 'user', content: userMessage }
  ];

  // Princeton sandbox endpoint URL
  const url = `${PRINCETON_ENDPOINT}v1/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages,
      max_tokens: 300,
      temperature: 0.8,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Princeton API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Sorry, I had trouble responding. Please try again.';
}
