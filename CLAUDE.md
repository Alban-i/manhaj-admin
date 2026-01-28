# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run types` - Generate TypeScript types from Supabase schema
- `bun run lint` - Run ESLint
- `bun run lint:fix` - Fix ESLint issues automatically

## Architecture Overview

This is a Next.js 15 application using App Router with TypeScript, serving as a content management system for Manhaj Salafi Admin. The architecture follows a modern full-stack pattern with:

- **Frontend**: React with TailwindCSS v4 and shadcn/ui components
- **Backend**: Next.js API routes and Server Actions
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Authentication**: Supabase Auth with role-based access control
- **Storage**: Cloudinary for media files
- **AI Integration**: DeepSeek API for content summarization

## Key Directories

- `/app/` - Next.js App Router pages and layouts
- `/components/` - Reusable React components with shadcn/ui
- `/lib/` - Utility functions, database client, and configurations
- `/actions/` - Server Actions for data fetching and mutations
- `/types/` - TypeScript type definitions (auto-generated from Supabase)
- `/extensions/` - Custom TipTap editor extensions

## Database Schema

The application uses Supabase with these main entities:
- `articles` - Main content with rich text, tags, and categories
- `posts` - Secondary content type
- `profiles` - User profiles linked to Supabase Auth
- `roles` - Role-based permissions (Admin, Author, Reader, Banned)
- `tags`, `categories`, `types` - Content organization
- `tasks` - Task management system

Many-to-many relationships exist between articles and tags via `article_tags` junction table.

## Rich Text Editor

The app uses TipTap with custom extensions:
- **Audio Extension**: Embed audio files with validation
- **Image Extension**: Handle image uploads and display
- **Quote Extension**: Format quoted text with styling
- **Post Reference Extension**: Link to other posts within content

Extensions are in `/extensions/` and handle both rendering and data persistence.

## Authentication & Authorization

- Uses Supabase Auth with middleware protection
- Role-based access control through `profiles.role` field
- Protected routes require authentication via `middleware.ts`
- Server Actions check permissions before data operations

## State Management

- **Zustand**: Client-side state management for UI state
- **TanStack Query**: Server state caching and synchronization
- **React Hook Form**: Form state with Zod validation schemas

## Development Patterns

- Server Actions in `/actions/` for data operations
- TypeScript types auto-generated from Supabase schema
- Form validation using Zod schemas
- Error handling with toast notifications
- Responsive design with TailwindCSS breakpoints
- Use `@hooks/use-wait.ts` instead of `setTimeout` for delays
- **Never use `any` as a type** - always use proper types, generics, or `unknown` with type guards

## Environment Requirements

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `DEEPSEEK_API_KEY` - DeepSeek AI API key
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name

## AI Integration

The application uses DeepSeek API for content summarization. The AI service is configured in `/lib/deepseek.ts` and used in Server Actions to automatically generate summaries for articles.

## Multi-language Support

The app supports Arabic content with proper RTL text direction and Arabic font loading. Language-specific styling is handled through TailwindCSS utilities.