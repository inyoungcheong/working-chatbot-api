import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { generateChatResponse, type ConversationPhase } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      res.status(400).json({ message: "Invalid conversation data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get all conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get a specific conversation with messages
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }

      const result = await storage.getConversationWithMessages(id);
      if (!result) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversation", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Send a message and get AI response
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }

      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      // Verify conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Create user message
      const userMessage = await storage.createMessage({
        conversationId,
        content,
        role: "user",
      });

      // Get conversation history for context
      const messages = await storage.getMessagesByConversationId(conversationId);
      const conversationHistory = messages
        .filter(msg => msg.id !== userMessage.id)
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));

      // Generate AI response using the conversation flow
      const aiResult = await generateChatResponse(
        conversation.currentPhase as ConversationPhase, 
        content, 
        conversationHistory
      );

      // Create assistant message
      const assistantMessage = await storage.createMessage({
        conversationId,
        content: aiResult.response,
        role: "assistant",
      });

      // Update conversation phase if it progressed
      if (conversation.currentPhase !== aiResult.nextPhase) {
        await storage.updateConversation(conversationId, { currentPhase: aiResult.nextPhase });
      }

      res.json({
        userMessage,
        assistantMessage,
        currentPhase: aiResult.nextPhase,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ 
        message: "Failed to process message", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
