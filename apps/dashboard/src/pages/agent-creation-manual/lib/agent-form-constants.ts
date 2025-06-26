export const CONTENT_TYPES = [
  { value: "blog_posts", label: "Blog Posts" },
  { value: "articles", label: "Articles" },
  { value: "social_media", label: "Social Media" },
  { value: "newsletters", label: "Newsletters" },
  { value: "product_descriptions", label: "Product Descriptions" },
  { value: "landing_pages", label: "Landing Pages" },
  { value: "email_campaigns", label: "Email Campaigns" },
  { value: "press_releases", label: "Press Releases" },
] as const;

export const VOICE_TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "friendly", label: "Friendly" },
  { value: "authoritative", label: "Authoritative" },
  { value: "conversational", label: "Conversational" },
  { value: "formal", label: "Formal" },
  { value: "humorous", label: "Humorous" },
  { value: "empathetic", label: "Empathetic" },
] as const;

export const TARGET_AUDIENCES = [
  { value: "general_public", label: "General Public" },
  { value: "professionals", label: "Professionals" },
  { value: "students", label: "Students" },
  { value: "executives", label: "Executives" },
  { value: "technical_audience", label: "Technical Audience" },
  { value: "consumers", label: "Consumers" },
  { value: "entrepreneurs", label: "Entrepreneurs" },
  { value: "academics", label: "Academics" },
] as const;

export const FORMATTING_STYLES = [
  { value: "structured", label: "Structured" },
  { value: "casual", label: "Casual" },
  { value: "technical", label: "Technical" },
] as const;
