/ 2. api/chat.js (새로 생성)
// Vercel의 serverless function으로 변환
import { generateResponse, analyzeConversationStage } from '../lib/ai-utils.js';

// In-memory storage (production에서는 Redis나 DB 사용 권장)
const conversations = new Map();
let conversationCounter = 1;

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
