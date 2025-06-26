import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Eye, FileText, Plus } from "lucide-react";

export const Route = createFileRoute("/_dashboard/content/")({
  component: Content,
});

// Mock data for content
const mockContent = [
  {
    agent: "AI News Agent",
    createdAt: "2024-01-16",
    excerpt:
      "Exploring how artificial intelligence is transforming the way we build and deploy web applications...",
    id: 1,
    lastModified: "2024-01-16",
    status: "draft",
    title: "The Future of AI in Web Development",
    wordCount: 1250,
  },
  {
    agent: "Tutorial Agent",
    createdAt: "2024-01-15",
    excerpt:
      "A comprehensive guide to understanding and implementing React Hooks in your applications...",
    id: 2,
    lastModified: "2024-01-15",
    status: "published",
    title: "Getting Started with React Hooks",
    wordCount: 2100,
  },
  {
    agent: "Product Updates",
    createdAt: "2024-01-14",
    excerpt:
      "We're excited to announce several new features that will enhance your dashboard experience...",
    id: 3,
    lastModified: "2024-01-16",
    status: "review",
    title: "Product Update: New Dashboard Features",
    wordCount: 800,
  },
];

function Content() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link search={{ agentId: "1" }} to="/content/generate">
                <Button className="ml-3">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Content
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Content Library
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage your AI-generated content and track publishing status
            </p>
          </div>

          {/* Content List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {mockContent.map((content) => (
                <li key={content.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-medium text-indigo-600 truncate">
                            {content.title}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <Badge
                              variant={
                                content.status === "published"
                                  ? "default"
                                  : content.status === "review"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {content.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <FileText className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          <p className="truncate">
                            {content.agent} • {content.wordCount} words
                          </p>
                          <span className="mx-2">•</span>
                          <p>Created {content.createdAt}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            {content.excerpt}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Link
                        search={{ generated: true, id: content.id }}
                        to="/content/review"
                      >
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </Link>
                      <Link search={{ id: content.id }} to="/content/export">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
