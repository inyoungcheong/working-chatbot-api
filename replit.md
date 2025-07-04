# Chat Application with AI Assistance

## Overview

This is a full-stack chat application built with React and Express that provides AI-powered conversations across multiple specialized modes. The application features a modern UI built with shadcn/ui components and supports different chat modes like greeting, decluttering thoughts, task breakdown, daily planning, rewards, and reporting.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **UI Library**: shadcn/ui components based on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **AI Integration**: Together AI API for chat completions using Llama-3-8b-chat-hf model
- **Session Management**: Express sessions with PostgreSQL store

## Key Components

### Database Schema
- **conversations**: Stores chat conversations with mode, title, and timestamps
- **messages**: Stores individual messages with role (user/assistant) and content
- **users**: User authentication system (prepared but not fully implemented)

### Conversation Flow
The application uses an organic, responsive conversation approach that adapts to user input while maintaining therapeutic structure:

**Dynamic Stages (Not Rigid Phases):**
1. **Opening**: Motivational quote + understanding what's on their mind today
2. **Exploration**: Natural follow-up questions based on their specific situation and concerns
3. **Examination**: CBT-style questioning when fears are shared, helping examine assumptions and thought patterns
4. **Planning**: Collaborative creation of 6 realistic 30-minute tasks based on their actual needs
5. **Refinement**: Adjusting plans and connecting with positive feelings about the work

**Key Features:**
- AI responds naturally to user's actual words rather than following scripts
- Conversation stage determined by content analysis, not message count
- References specific user concerns and shows active listening
- Maintains therapeutic goals while feeling like a genuine conversation
- Adapts pacing and approach based on user's emotional state and readiness

### API Endpoints
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/:id` - Get conversation with messages
- `POST /api/conversations/:id/messages` - Send message and get AI response

## Data Flow

1. **Conversation Creation**: Frontend creates a new conversation for the selected mode
2. **Message Exchange**: User sends messages which are stored and forwarded to OpenAI
3. **AI Response**: OpenAI generates contextual responses based on the chat mode
4. **Real-time Updates**: UI updates with typing indicators and message bubbles
5. **Persistence**: All conversations and messages are stored in PostgreSQL

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL with Drizzle ORM for type-safe database operations
- **AI Service**: OpenAI API for generating intelligent responses
- **UI Components**: Radix UI primitives for accessible component foundation
- **Validation**: Zod for runtime type checking and schema validation

### Development Tools
- **Build**: Vite for fast development and optimized builds
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Fast bundling for production server builds

## Deployment Strategy

### Build Process
- Frontend: Vite builds optimized React application to `dist/public`
- Backend: ESBuild bundles TypeScript server to `dist/index.js`
- Database: Drizzle handles schema migrations and type generation

### Environment Requirements
- `DATABASE_URL`: PostgreSQL connection string (Neon Database)
- `TOGETHER_API_KEY`: Together AI API key for chat completions
- Node.js environment with ESM support

### Production Deployment
- Server runs on `NODE_ENV=production`
- Static files served from Express
- Database migrations applied via `npm run db:push`

## Changelog
- July 04, 2025: Initial setup with empathetic chatbot functionality
- July 04, 2025: Migrated from OpenAI to Together AI for chat completions using Llama-3-8b-chat-hf model
- July 04, 2025: Redesigned from multiple modes to single conversation flow system (rewards → fears → tasks → planning → report)
- July 04, 2025: Implemented therapeutic CBT-inspired conversation flow with motivation quotes, brief questions, space for reflection, and 6 bite-sized 30-minute tasks
- July 04, 2025: Rebuilt conversation system to be organic and responsive - AI now responds naturally to user's actual words rather than following rigid scripts, with dynamic stage determination based on content analysis

## User Preferences

Preferred communication style: Simple, everyday language.