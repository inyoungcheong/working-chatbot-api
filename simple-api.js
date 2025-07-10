// simple-api.js
import express from 'express';

const app = express();

// Manual CORS handling
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

const PORT = process.env.PORT || 5000;
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

const conversations = new Map();
let conversationCounter = 1;

function analyzeConversationStage(conversationHistory) {
  const userMessages = conversationHistory.filter(msg => msg.role === 'user');
  const allUserText = userMessages.map(msg => msg.content.toLowerCase()).join(' ');

  if (userMessages.length === 0) return 'opening';

  const mentionedTasks = /\b(task|work|project|write|chapter|deadline)\b/.test(allUserText);
  const mentionedFears = /\b(fear|worry|anxious|overwhelm|scared|difficult)\b/.test(allUserText);
  const lastMessage = userMessages[userMessages.length - 1]?.content.toLowerCase() || '';
  const wantsBreakdown = /\b(break|step|plan|how)\b/.test(lastMessage);

  if (wantsBreakdown) return 'planning';
  if (mentionedTasks && mentionedFears && userMessages.length >= 4) return 'planning';
  if (mentionedTasks && mentionedFears && userMessages.length >= 2) return 'examination';
  if (mentionedTasks || userMessages.length >= 2) return 'exploration';

  return 'opening';
}

function userExplicitlyAskedForBreakdown(message) {
  const text = message.toLowerCase();
  return /\b(how should i start|can you break|can you split|can you plan|make a plan|step by step|bite-sized|what should i do first)\b/.test(text);
}

function detectTaskType(message) {
  const text = message.toLowerCase();
  const match = (keywords) => keywords.some(kw => text.includes(kw));

  if (match(['thesis', 'chapter', 'revise', 'edit', 'citation', 'proofread', 'footnote', 'draft'])) return 'academic';
  if (match(['email', 'form', 'spreadsheet', 'meeting', 'budget', 'calendar', 'submit'])) return 'admin';
  if (match(['fellowship', 'cover letter', 'cv', 'resume', 'statement', 'interview', 'recommendation'])) return 'application';
  if (match(['code', 'analyze', 'stata', 'python', 'colab', 'dataset', 'regression'])) return 'data';

  return 'general';
}

async function generateResponse(conversationHistory, userMessage) {
  if (!TOGETHER_API_KEY) throw new Error('TOGETHER_API_KEY not configured');

  const stage = analyzeConversationStage(conversationHistory);
  const taskType = detectTaskType(userMessage);
  const explicitlyAsked = userExplicitlyAskedForBreakdown(userMessage);

  let systemPrompt = '';
  if (stage === 'planning') {
    systemPrompt = explicitlyAsked
      ? `The user asked for task breakdown. Provide 2–4 bullet points tailored to a ${taskType} task. Each should be short (1 line), concrete, and doable within 30–60 minutes. Avoid vague or mechanical suggestions.`
      : `The user is ready for planning. Ask: “Would it help if I broke this into bite-sized tasks?” If yes, return 2–4 short bullet points tailored to a ${taskType} task.`;
  } else if (stage === 'opening') {
    const firstUserMsg = conversationHistory.find(msg => msg.role === 'user');
    const isUrgentOpening = firstUserMsg && firstUserMsg.content.length > 100;
    systemPrompt = isUrgentOpening
      ? `You're a warm, helpful daily planning assistant. The user just shared a concern—respond right away with supportive acknowledgment and one gentle follow-up question. No need for a quote.`
      : `You're a warm, empathetic daily planning assistant. Start with a short encouraging quote, then ask what’s on their mind today. Keep it light and under 100 words.`;
  } else if (stage === 'exploration') {
    systemPrompt = `Continue the conversation naturally. Ask follow-up questions about their tasks or situation. Show you're listening by referencing their specific words. Be genuinely curious and conversational.`;
  } else if (stage === 'examination') {
    systemPrompt = `The user has shared both tasks and concerns. Help them gently examine their thoughts using insights from cognitive behavioral therapy (CBT). Ask one or two warm, reflective questions that encourage them to explore their specific fears or assumptions. Prompt them to notice whether any of their thoughts might be exaggerated, self-critical, unrealistic, or all-or-nothing in tone. Avoid judgment or advice—just help them clarify their thinking and consider alternative interpretations.`;
  } else {
    systemPrompt = `Respond naturally and supportively to the user's daily planning needs. Be brief, responsive, and keep the tone warm.`;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-8),
    { role: 'user', content: userMessage }
  ];

  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3-8b-chat-hf',
      messages,
      max_tokens: 300,
      temperature: 0.8,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Together AI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Sorry, I had trouble responding. Please try again.';
}

app.get('/api/conversations', (req, res) => {
  res.json({ 
    message: 'Daily Planner API is running!',
    conversations: Array.from(conversations.keys())
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const convId = conversationId || `conv_${conversationCounter++}`;
    if (!conversations.has(convId)) {
      conversations.set(convId, []);
    }

    const conversationHistory = conversations.get(convId);
    const aiResponse = await generateResponse(conversationHistory, message);

    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    );

    if (conversationHistory.length > 20) {
      conversationHistory.splice(0, conversationHistory.length - 20);
    }

    res.json({
      message: aiResponse,
      conversationId: convId,
      stage: analyzeConversationStage(conversationHistory)
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    hasTogetherKey: !!TOGETHER_API_KEY
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Daily Planner API running on port ${PORT}`);
  console.log(`💡 Together AI configured: ${!!TOGETHER_API_KEY}`);
});

export default app;

