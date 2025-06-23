# Database Model for Content Management System

This document outlines the complete database schema designed to support the BlogAI content management prototype. The model includes all tables, relationships, and types needed to make the prototype fully functional.

## Overview

The database model supports:
- User authentication (existing)
- AI agent configuration and management
- Content generation and workflow
- Project organization
- Comment system for collaboration
- Export tracking
- Dashboard analytics

## Database Schema

### Core Tables

#### 1. Projects (`project`)
Organizes agents and content into logical groups.

```sql
CREATE TABLE "project" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
```

#### 2. AI Agents (`agent`)
Core configuration for AI content generation agents.

```sql
CREATE TYPE "content_type" AS ENUM ('blog_posts', 'social_media', 'marketing_copy', 'technical_docs');
CREATE TYPE "voice_tone" AS ENUM ('professional', 'conversational', 'educational', 'creative');
CREATE TYPE "target_audience" AS ENUM ('general_public', 'professionals', 'beginners', 'customers');
CREATE TYPE "formatting_style" AS ENUM ('structured', 'narrative', 'list_based');

CREATE TABLE "agent" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "project_id" text REFERENCES "project"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  
  -- Content configuration
  "content_type" content_type NOT NULL,
  "voice_tone" voice_tone NOT NULL,
  "target_audience" target_audience NOT NULL,
  "formatting_style" formatting_style DEFAULT 'structured',
  
  -- Topics and keywords as JSON arrays
  "topics" json DEFAULT '[]',
  "seo_keywords" json DEFAULT '[]',
  
  -- Agent status and metadata
  "is_active" boolean DEFAULT true,
  "last_generated_at" timestamp,
  
  -- Statistics
  "total_drafts" integer DEFAULT 0,
  "total_published" integer DEFAULT 0,
  
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
```

#### 3. Content (`content`)
Stores generated articles and posts.

```sql
CREATE TYPE "content_status" AS ENUM ('draft', 'review', 'published', 'archived');

CREATE TABLE "content" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "excerpt" text,
  
  -- SEO and metadata
  "meta_description" text,
  "tags" json DEFAULT '[]',
  "slug" text,
  
  -- Content metrics
  "word_count" integer DEFAULT 0,
  "read_time_minutes" integer DEFAULT 0,
  
  -- Status and workflow
  "status" content_status DEFAULT 'draft',
  
  -- Relationships
  "agent_id" text NOT NULL REFERENCES "agent"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  
  -- Publishing info
  "published_at" timestamp,
  "scheduled_at" timestamp,
  
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
```

#### 4. Content Requests (`content_request`)
Tracks generation history and settings.

```sql
CREATE TYPE "content_length" AS ENUM ('short', 'medium', 'long');
CREATE TYPE "priority" AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE "content_request" (
  "id" text PRIMARY KEY NOT NULL,
  "topic" text NOT NULL,
  "brief_description" text NOT NULL,
  "target_length" content_length DEFAULT 'medium',
  "priority" priority DEFAULT 'normal',
  "include_images" boolean DEFAULT false,
  
  -- Generation results
  "generated_content_id" text REFERENCES "content"("id") ON DELETE set null,
  "is_completed" boolean DEFAULT false,
  
  -- Relationships
  "agent_id" text NOT NULL REFERENCES "agent"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
```

#### 5. Comments (`comment`)
Review and collaboration system.

```sql
CREATE TABLE "comment" (
  "id" text PRIMARY KEY NOT NULL,
  "content" text NOT NULL,
  
  -- Relationships
  "content_id" text NOT NULL REFERENCES "content"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  
  -- Comment metadata
  "is_resolved" boolean DEFAULT false,
  "parent_comment_id" text REFERENCES "comment"("id") ON DELETE cascade,
  
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
```

#### 6. Export Log (`export_log`)
Tracks export history.

```sql
CREATE TABLE "export_log" (
  "id" text PRIMARY KEY NOT NULL,
  "format" text NOT NULL, -- markdown, html, docx, etc.
  "filename" text NOT NULL,
  "options" json DEFAULT '{}',
  
  -- Relationships
  "content_id" text NOT NULL REFERENCES "content"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  
  "created_at" timestamp NOT NULL DEFAULT now()
);
```

## Key Features Supported

### 1. Agent Management
- **Create/Edit Agents**: Full CRUD operations for AI agents
- **Agent Configuration**: Content type, voice tone, audience, formatting style
- **Topics & Keywords**: JSON arrays for flexible topic and SEO keyword management
- **Agent Statistics**: Track drafts created and content published
- **Project Organization**: Optional grouping of agents by project

### 2. Content Workflow
- **Generation Requests**: Track what users want to generate
- **Content Drafts**: Store generated content with full metadata
- **Status Management**: Draft → Review → Published workflow
- **SEO Support**: Meta descriptions, tags, slugs
- **Scheduling**: Support for scheduled publishing

### 3. Collaboration
- **Comments**: Threaded comments on content for review
- **User Attribution**: All actions tied to specific users
- **Resolution Tracking**: Mark comments as resolved

### 4. Analytics & Reporting
- **Dashboard Stats**: Active agents, draft counts, published content
- **Agent Performance**: Track success rates and generation history
- **Export Tracking**: Monitor what content is exported and in what formats

### 5. Data Relationships

```
User (auth)
├── Projects
│   └── Agents
│       ├── Content
│       └── Content Requests
├── Content (direct)
│   ├── Comments
│   └── Export Logs
└── Comments (direct)
```

## TypeScript Types

The schema supports these TypeScript interfaces:

```typescript
// Agent Configuration
interface CreateAgentRequest {
  name: string;
  description?: string;
  projectId?: string;
  contentType: 'blog_posts' | 'social_media' | 'marketing_copy' | 'technical_docs';
  voiceTone: 'professional' | 'conversational' | 'educational' | 'creative';
  targetAudience: 'general_public' | 'professionals' | 'beginners' | 'customers';
  formattingStyle?: 'structured' | 'narrative' | 'list_based';
  topics?: string[];
  seoKeywords?: string[];
}

// Content Generation
interface CreateContentRequest {
  topic: string;
  briefDescription: string;
  targetLength?: 'short' | 'medium' | 'long';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  includeImages?: boolean;
  agentId: string;
}

// Dashboard Statistics
interface DashboardStats {
  activeAgents: number;
  draftsReady: number;
  publishedThisMonth: number;
  totalArticles: number;
}
```

## Implementation Steps

### 1. Database Migration
```bash
cd apps/server
bun run generate  # Generate migration from schema
bun run push      # Apply to database
```

### 2. Service Layer
Create services for:
- `ProjectService`: CRUD operations for projects
- `AgentService`: Agent management and configuration
- `ContentService`: Content generation and management
- `CommentService`: Review and collaboration
- `AnalyticsService`: Dashboard statistics

### 3. API Routes
Implement REST endpoints:
```
/api/projects/*
/api/agents/*
/api/content/*
/api/comments/*
/api/analytics/*
/api/export/*
```

### 4. Frontend Integration
Update dashboard components to use real data:
- Replace mock data with API calls
- Implement proper state management
- Add error handling and loading states

## Mock Data Migration

The prototype currently uses these mock data structures that map to the database:

### Agents (`apps/dashboard/src/routes/agents/index.tsx`)
```typescript
const mockAgents = [
  {
    id: 1,
    name: "AI News Agent",
    project: "Tech Blog",
    tone: "Professional",
    audience: "Tech enthusiasts",
    topics: ["AI", "Machine Learning", "Technology"],
    seoKeywords: ["artificial intelligence", "tech news", "innovation"],
    status: "active",
    drafts: 3,
    published: 12,
    lastGenerated: "2024-01-15"
  }
  // ... maps to agent table
];
```

### Content (`apps/dashboard/src/routes/content/index.tsx`)
```typescript
const mockContent = [
  {
    id: 1,
    title: "The Future of AI in Web Development",
    excerpt: "Exploring how artificial intelligence is transforming...",
    agent: "AI News Agent",
    status: "draft",
    wordCount: 1250,
    createdAt: "2024-01-16",
    lastModified: "2024-01-16"
  }
  // ... maps to content table
];
```

## Security Considerations

1. **Row Level Security**: All queries filtered by `user_id`
2. **Input Validation**: Validate all enum values and required fields
3. **Rate Limiting**: Limit content generation requests per user
4. **Content Sanitization**: Sanitize user-generated content and comments
5. **Export Limits**: Track and limit export frequency

## Performance Optimizations

1. **Indexes**: Add indexes on frequently queried columns
```sql
CREATE INDEX idx_agent_user_id ON agent(user_id);
CREATE INDEX idx_content_user_id ON content(user_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_created_at ON content(created_at);
```

2. **Pagination**: Implement cursor-based pagination for large datasets
3. **Caching**: Cache dashboard statistics and agent configurations
4. **Content Search**: Consider full-text search indexes for content body

## Future Enhancements

1. **Versioning**: Content version history and rollback
2. **Templates**: Reusable content templates
3. **Workflows**: Custom approval workflows
4. **Integrations**: Connect to external publishing platforms
5. **Analytics**: Advanced content performance metrics
6. **AI Training**: Learn from user feedback to improve generation

This database model provides a solid foundation for the content management system prototype and can scale to support advanced features as the application grows. 