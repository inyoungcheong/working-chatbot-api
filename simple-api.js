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
  
  if (userMessages.length === 0) return 'exploration';
  
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
  
  return 'exploration';
}

function analyzeUserStyle(conversationHistory) {
  const userMessages = conversationHistory.filter(msg => msg.role === 'user');
  const allText = userMessages.join(' ').toLowerCase();
  
  return {
    prefersBrevity: userMessages.some(msg => msg.content.length < 50),
    mentionsEmotions: allText.includes('feel') || allText.includes('anxious'),
    wantsSpecifics: allText.includes('how') || allText.includes('what exactly')
  };
}

// Generate AI response using Together AI
async function generateResponse(conversationHistory, userMessage) {
  if (!TOGETHER_API_KEY) {
    throw new Error('TOGETHER_API_KEY not configured');
  }

  const stage = analyzeConversationStage(conversationHistory);
  
  // 시간대 분석
  const timeOfDay = new Date().getHours();
  const timeContext = timeOfDay < 12 ? "morning energy" : 
                     timeOfDay < 17 ? "afternoon momentum" : "evening reflection";
  
  // 사용자 스타일 분석
  const userStyle = analyzeUserStyle(conversationHistory);
  
  // Base instructions
  const baseInstructions = `You are a brief, focused daily planning assistant using CBT methods. Use "I" not "we". Avoid: "lie in", "complex", "intricate". `;
  
  // 시간대와 사용자 스타일에 따른 추가 context
  let contextualNotes = `Current time context: ${timeContext}. `;
  
  if (userStyle.prefersBrevity) {
    contextualNotes += "User prefers brief responses. ";
  }
  if (userStyle.mentionsEmotions) {
    contextualNotes += "User is emotionally aware - acknowledge feelings. ";
  }
  if (userStyle.wantsSpecifics) {
    contextualNotes += "User wants specific details and steps. ";
  }
  
  let systemPrompt = '';
  switch (stage) {
    case 'exploration':
      systemPrompt = baseInstructions + contextualNotes + `Ask "What's holding you back?" and mirror their response back to show you heard them.`;
      break;
    case 'examination':
      systemPrompt = baseInstructions + contextualNotes + `Ask "What would you want instead?" Help them visualize the desired outcome. If they share more concerns, gently explore those specific fears.`;
      break;
    case 'planning':
      systemPrompt = baseInstructions + contextualNotes + `Say "Let's break this down into smaller steps." Give 2-3 specific, tiny first actions they can take today.`;
      break;
    default:
      systemPrompt = baseInstructions + contextualNotes + `Ask what's blocking them today and listen carefully. Keep responses under 2-3 sentences.`;
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
