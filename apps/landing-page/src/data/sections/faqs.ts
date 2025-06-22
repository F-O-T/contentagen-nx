export interface FaqItem {
  question: string;
  answer: string;
}

export const faqs: { title: string; description: string }[] = [
  {
    title: "How is BlogGenius different from other AI writing tools?",
    description:
      "Unlike generic AI tools, BlogGenius creates personalized content agents that learn your specific brand voice, tone, and style. Each agent maintains consistency across all content while optimizing for SEO and conversions. We focus specifically on blog automation with features like multi-format export, direct publishing, and comprehensive project management.",
  },
  {
    title: "Can I create multiple content agents for different brands or topics?",
    description:
      "You can create unlimited content agents, each configured with unique brand voices, target audiences, keywords, and content guidelines. This is perfect for agencies managing multiple clients or bloggers covering different topics. Each agent operates independently while maintaining its specific brand consistency.",
  },
  {
    title: "What formats can I export my content in?",
    description:
      "BlogGenius supports multiple export formats including Markdown (.md), HTML, Microsoft Word (.docx), and plain text. You can also publish directly to popular platforms like WordPress, Medium, Ghost, and more. We're constantly adding new integrations based on user feedback.",
  },
  {
    title: "How does the SEO optimization work?",
    description:
      "Our AI agents automatically optimize content for search engines by incorporating your specified keywords naturally, creating proper heading structures, optimizing meta descriptions, and ensuring optimal content length. Each piece of content receives an SEO score with specific recommendations for improvement.",
  },
  {
    title: "Is there a limit to how much content I can generate?",
    description:
      "Our plans are designed to scale with your needs. The free trial includes 50 blog posts, and our paid plans offer generous limits or unlimited generation depending on your tier. We believe in providing value without artificial restrictions that limit your growth.",
  },
  {
    title: "Can I edit and customize the generated content?",
    description:
      "Yes! Every piece of generated content can be fully edited using our built-in editor. You can modify text, adjust formatting, add images, and make any changes needed. The platform also learns from your edits to improve future content generation for that specific agent.",
  },
  {
    title: "How secure is my content and data?",
    description:
      "We take security seriously. Your content and data are encrypted in transit and at rest. We never use your content to train our models or share your data with third parties. We're SOC 2 compliant and offer enterprise-grade security features for business users.",
  },
  {
    title: "What happens after my free trial ends?",
    description:
      "After your 14-day free trial, you can choose from our flexible pricing plans. You'll retain access to all content created during the trial, and you can export everything before deciding. We offer month-to-month plans with no long-term commitments, so you can cancel anytime.",
  },
];
