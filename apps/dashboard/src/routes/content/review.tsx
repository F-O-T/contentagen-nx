import { Button } from "@packages/ui/components/button";
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Save, Share2 } from "lucide-react";
import { useId, useState } from "react";

export const Route = createFileRoute("/content/review")({
  component: ReviewContent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      generated: Boolean(search.generated) || false,
      id: Number(search.id) || 1,
    };
  },
});

function ReviewContent() {
  const titleFieldId = useId();
  const contentFieldId = useId();
  const seoDescriptionFieldId = useId();
  const tagsFieldId = useId();

  const navigate = useNavigate();
  const { id, generated } = useSearch({ from: "/content/review" });
  const [content, setContent] = useState(
    generated ? generatedContent : mockContent,
  );
  const [comment, setComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log("Saving content:", content);
    navigate({ to: "/content" });
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      console.log("Adding comment:", comment);
      setComment("");
      setShowCommentBox(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/">
                <h1 className="text-xl font-bold text-gray-900">BlogAI</h1>
              </Link>
              <div className="ml-6">
                <span className="text-gray-500">/ Review Content</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowCommentBox(!showCommentBox)}
                variant="outline"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Comment
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Link to="/content">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Content
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {generated && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 text-green-400">✓</div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Content Generated Successfully!
                  </h3>
                  <p className="mt-1 text-sm text-green-700">
                    Your AI agent has created a new draft. Review and edit as
                    needed before publishing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comment Box */}
          {showCommentBox && (
            <div className="mb-6 bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Add Comment
              </h3>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your feedback or notes..."
                rows={3}
                value={comment}
              />
              <div className="mt-3 flex justify-end space-x-2">
                <Button
                  onClick={() => setShowCommentBox(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddComment}>Add Comment</Button>
              </div>
            </div>
          )}

          {/* Content Editor */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {content.title}
                  </h2>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span>{content.wordCount} words</span>
                    <span className="mx-2">•</span>
                    <span>{content.readTime}</span>
                    <span className="mx-2">•</span>
                    <span>Last updated {content.lastModified}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link search={{ id }} to="/content/export">
                    <Button size="sm" variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    htmlFor={titleFieldId}
                  >
                    Title
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    id={titleFieldId}
                    onChange={(e) =>
                      setContent({ ...content, title: e.target.value })
                    }
                    type="text"
                    value={content.title}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    htmlFor={contentFieldId}
                  >
                    Content
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                    id={contentFieldId}
                    onChange={(e) =>
                      setContent({ ...content, body: e.target.value })
                    }
                    rows={20}
                    value={content.body}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    htmlFor={seoDescriptionFieldId}
                  >
                    SEO Description
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    id={seoDescriptionFieldId}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        metaDescription: e.target.value,
                      })
                    }
                    placeholder="Brief description for search engines..."
                    type="text"
                    value={content.metaDescription}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    htmlFor={tagsFieldId}
                  >
                    Tags
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    id={tagsFieldId}
                    onChange={(e) =>
                      setContent({ ...content, tags: e.target.value })
                    }
                    placeholder="Comma-separated tags..."
                    type="text"
                    value={content.tags}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between">
            <Link to="/content">
              <Button variant="outline">Back to Content</Button>
            </Link>
            <div className="flex space-x-3">
              <Button variant="outline">Save as Draft</Button>
              <Button>Publish</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Mock content for existing articles
const mockContent = {
  body: `# The Future of AI in Web Development

Artificial intelligence is revolutionizing the way we approach web development, from automated code generation to intelligent design systems. As we look toward the future, it's clear that AI will play an increasingly important role in how we build, deploy, and maintain web applications.

## Current State of AI in Web Development

Today's web developers are already benefiting from AI-powered tools that can:

- Generate boilerplate code automatically
- Suggest optimizations for performance
- Detect and fix common security vulnerabilities
- Provide intelligent code completion

## Emerging Trends

### Automated Testing
AI is making significant strides in automated testing, with tools that can generate comprehensive test suites and identify edge cases that human developers might miss.

### Design-to-Code Translation
New AI systems can convert design mockups directly into functional code, dramatically reducing the time between design and implementation.

### Intelligent Debugging
AI-powered debugging tools can analyze code patterns and suggest fixes for complex issues, making troubleshooting more efficient.

## Challenges and Considerations

While AI offers tremendous potential, there are important considerations:

- **Code Quality**: Ensuring AI-generated code meets quality standards
- **Security**: Maintaining security best practices in automated systems
- **Learning Curve**: Helping developers adapt to AI-assisted workflows

## Looking Ahead

The future of web development will likely see even deeper integration of AI, with tools that can understand context, learn from project patterns, and provide increasingly sophisticated assistance to developers.

As these technologies mature, we can expect to see more accessible web development, faster prototyping, and new possibilities for creating dynamic, intelligent web applications.`,
  lastModified: "2024-01-16",
  metaDescription:
    "Exploring how artificial intelligence is transforming web development practices and tools.",
  readTime: "5 min read",
  tags: "AI, web development, technology, future",
  title: "The Future of AI in Web Development",
  wordCount: 1250,
};

// Generated content for new articles
const generatedContent = {
  body: `# The Rise of AI-Powered Content Creation

The landscape of content creation is undergoing a revolutionary transformation. Artificial intelligence has emerged as a powerful ally for creators, marketers, and businesses looking to scale their content production while maintaining quality and relevance.

## The Current Content Creation Challenge

Traditional content creation faces several challenges:

- **Time Constraints**: Creating high-quality content takes significant time
- **Consistency**: Maintaining brand voice across multiple pieces
- **Scale**: Meeting the demand for constant content publication
- **Personalization**: Tailoring content for different audiences

## How AI is Changing the Game

### Automated Writing Assistance
AI writing tools can now generate drafts, suggest improvements, and help overcome writer's block. These tools don't replace human creativity but augment it.

### Content Optimization
AI analyzes performance data to suggest topics, headlines, and formats that resonate with specific audiences.

### Multi-format Content
Modern AI can adapt a single piece of content into multiple formats - blog posts, social media updates, newsletters, and more.

## Benefits for Different Industries

### Marketing Teams
- Faster campaign content creation
- A/B testing of different messaging approaches
- Personalized content at scale

### Educational Content
- Adaptive learning materials
- Automated quiz and assessment generation
- Multi-language content translation

### E-commerce
- Product descriptions at scale
- Personalized recommendations
- Dynamic pricing content

## Best Practices for AI-Powered Content

1. **Human Oversight**: Always review and edit AI-generated content
2. **Brand Guidelines**: Train AI tools on your specific brand voice
3. **Quality Control**: Implement processes to maintain content standards
4. **Authenticity**: Use AI to enhance, not replace, human insight

## The Future Landscape

As AI technology continues to evolve, we can expect:

- More sophisticated understanding of context and nuance
- Better integration with content management systems
- Advanced personalization capabilities
- Improved collaboration between human creators and AI

## Conclusion

AI-powered content creation represents a significant opportunity for businesses and creators to scale their efforts while maintaining quality. The key is finding the right balance between automation and human creativity.

The future belongs to those who can effectively combine AI efficiency with human insight, creating content that is both scalable and authentic.`,
  lastModified: "2024-01-16",
  metaDescription:
    "Discover how AI is transforming content creation across industries and what it means for creators.",
  readTime: "6 min read",
  tags: "AI, content creation, automation, digital marketing",
  title: "The Rise of AI-Powered Content Creation",
  wordCount: 1500,
};
