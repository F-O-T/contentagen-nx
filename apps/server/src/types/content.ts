import type {
  agent,
  comment,
  content,
  contentRequest,
  exportLog,
  project,
} from "@api/schemas/content-schema";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

// Database model types
export type Project = InferSelectModel<typeof project>;
export type NewProject = InferInsertModel<typeof project>;

export type Agent = InferSelectModel<typeof agent>;
export type NewAgent = InferInsertModel<typeof agent>;

export type Content = InferSelectModel<typeof content>;
export type NewContent = InferInsertModel<typeof content>;

export type ContentRequest = InferSelectModel<typeof contentRequest>;
export type NewContentRequest = InferInsertModel<typeof contentRequest>;

export type Comment = InferSelectModel<typeof comment>;
export type NewComment = InferInsertModel<typeof comment>;

export type ExportLog = InferSelectModel<typeof exportLog>;
export type NewExportLog = InferInsertModel<typeof exportLog>;

// Extended types with relations
export type AgentWithStats = Agent & {
  project?: Project | null;
  _count?: {
    content: number;
    contentRequests: number;
  };
};

export type ContentWithDetails = Content & {
  agent: Agent;
  comments?: Comment[];
  _count?: {
    comments: number;
  };
};

export type ProjectWithAgents = Project & {
  agents: Agent[];
  _count?: {
    agents: number;
    content: number;
  };
};

// API request/response types
export interface CreateAgentRequest {
  name: string;
  description?: string;
  projectId?: string;
  contentType:
    | "blog_posts"
    | "social_media"
    | "marketing_copy"
    | "technical_docs";
  voiceTone: "professional" | "conversational" | "educational" | "creative";
  targetAudience:
    | "general_public"
    | "professionals"
    | "beginners"
    | "customers";
  formattingStyle?: "structured" | "narrative" | "list_based";
  topics?: string[];
  seoKeywords?: string[];
}

export interface UpdateAgentRequest extends Partial<CreateAgentRequest> {
  id: string;
  isActive?: boolean;
}

export interface CreateContentRequest {
  topic: string;
  briefDescription: string;
  targetLength?: "short" | "medium" | "long";
  priority?: "low" | "normal" | "high" | "urgent";
  includeImages?: boolean;
  agentId: string;
}

export interface UpdateContentRequest {
  id: string;
  title?: string;
  body?: string;
  excerpt?: string;
  metaDescription?: string;
  tags?: string[];
  slug?: string;
  status?: "draft" | "review" | "published" | "archived";
  scheduledAt?: Date;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface ExportContentRequest {
  contentId: string;
  format: "markdown" | "html" | "docx" | "pdf";
  filename?: string;
  options?: {
    includeMetadata?: boolean;
    includeTags?: boolean;
    includeImages?: boolean;
    customFilename?: string;
  };
}

export interface AddCommentRequest {
  contentId: string;
  content: string;
  parentCommentId?: string;
}

// Dashboard stats types
export interface DashboardStats {
  activeAgents: number;
  draftsReady: number;
  publishedThisMonth: number;
  totalArticles: number;
}

export interface AgentStats {
  id: string;
  name: string;
  totalDrafts: number;
  totalPublished: number;
  lastGeneratedAt?: Date;
  status: "active" | "inactive";
}

// Content generation types
export interface GenerationProgress {
  requestId: string;
  status: "pending" | "generating" | "completed" | "failed";
  progress?: number;
  estimatedCompletion?: Date;
  error?: string;
}

// Search and filter types
export interface ContentFilters {
  status?: "draft" | "review" | "published" | "archived";
  agentId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  search?: string;
}

export interface AgentFilters {
  isActive?: boolean;
  contentType?:
    | "blog_posts"
    | "social_media"
    | "marketing_copy"
    | "technical_docs";
  projectId?: string;
  search?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
