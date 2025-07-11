// simple-api.js
import express from 'express';

const app = express();

// Manual CORS handling (no package needed)
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

// Simple in-memory conversation storage
const conversations = new Map();
let conversationCounter = 1;

// Conversation stage analysis (from your Replit code)
function analyzeConversationStage(conversationHistory) {
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

// Generate AI response using Together AI
async function generateResponse(conversationHistory, userMessage) {
  if (!TOGETHER_API_KEY) {
    throw new Error('TOGETHER_API_KEY not configured');
  }

  const stage = analyzeConversationStage(conversationHistory);
  
  let systemPrompt = '';
  switch (stage) {
    case 'opening':
      systemPrompt = `You are a warm, empathetic daily planning assistant. Start with a brief inspiring quote about overcoming creative challenges. Then ask them what's on their mind today. Keep it conversational and under 100 words.`;
      break;
    case 'exploration':
      systemPrompt = `Continue the conversation naturally. Ask follow-up questions about their tasks or situation. Show you're listening by referencing their specific words. Be genuinely curious and conversational.`;
      break;
    case 'examination':
      systemPrompt = `They've shared both tasks and concerns. Now gently help them examine their thoughts. Ask thoughtful questions about their specific fears or worries. Help them see if concerns are realistic.`;
      break;
    case 'planning':
      systemPrompt = `They're ready for practical planning. Help break down their work into specific, realistic tasks. Base these directly on what they've told you. Be concise, focusing on actionable items and keep it under 150 words.`;
      break;
    default:
      systemPrompt = `Have a natural, supportive conversation about their daily planning needs. Listen carefully and respond to what they actually say.`;
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

// API Routes
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

    // Get or create conversation
    const convId = conversationId || `conv_${conversationCounter++}`;
    if (!conversations.has(convId)) {
      conversations.set(convId, []);
    }
    
    const conversationHistory = conversations.get(convId);
    
    // Generate AI response
    const aiResponse = await generateResponse(conversationHistory, message);
    
    // Update conversation history
    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    );
    
    // Keep only last 20 messages
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
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message 
    });
  }
});

// Health check
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
