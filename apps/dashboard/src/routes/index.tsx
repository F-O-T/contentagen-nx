import { Button } from "@packages/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Bot,
  FileText,
  Plus,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">BlogAI</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  to="/"
                >
                  Dashboard
                </Link>
                <Link
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  to="/agents"
                >
                  Agents
                </Link>
                <Link
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  to="/content"
                >
                  Content
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link to="/onboarding">
                <Button className="ml-3">
                  <Plus className="w-4 h-4 mr-2" />
                  New Agent
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
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage your AI content agents and track their performance
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden border rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Agents
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">3</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden border rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Drafts Ready
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">6</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden border rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Published This Month
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">25</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden border rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Settings className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Articles
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">47</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {/* Agents Card */}
            <Link className="group" to="/agents">
              <div className="bg-white overflow-hidden rounded-lg transition-all duration-200 cursor-pointer border hover:border-blue-200">
                <div className="p-8">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-6 mx-auto group-hover:bg-blue-200 transition-colors">
                    <Bot className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-900">
                      Manage Agents
                    </h3>
                    <p className="text-gray-600 mb-4 group-hover:text-gray-700">
                      Create, edit, and configure your AI content agents
                    </p>
                    <p className="text-sm text-blue-600 font-medium group-hover:text-blue-700">
                      Click to view →
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Articles Card */}
            <Link className="group" to="/content">
              <div className="bg-white overflow-hidden rounded-lg transition-all duration-200 cursor-pointer border hover:border-green-200">
                <div className="p-8">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-6 mx-auto group-hover:bg-green-200 transition-colors">
                    <BookOpen className="h-8 w-8 text-green-600 group-hover:text-green-700" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-900">
                      Manage Articles
                    </h3>
                    <p className="text-gray-600 mb-4 group-hover:text-green-700">
                      Review, edit, and publish your generated content
                    </p>
                    <p className="text-sm text-green-600 font-medium group-hover:text-green-700">
                      Click to view →
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
