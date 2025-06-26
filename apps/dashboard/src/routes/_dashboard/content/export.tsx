import { Button } from "@packages/ui/components/button";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Download, FileText, Globe, Hash } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_dashboard/content/export")({
  component: ExportContent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: Number(search.id) || 1,
    };
  },
});

function ExportContent() {
  const { id } = useSearch({ from: "/content/export" });
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [exportOptions, setExportOptions] = useState({
    customFilename: "",
    includeImages: false,
    includeMetadata: true,
    includeTags: true,
  });

  const exportFormats = [
    {
      description: "Plain text with formatting syntax (.md)",
      extension: ".md",
      features: ["Lightweight", "Version control friendly", "Cross-platform"],
      icon: Hash,
      id: "markdown",
      name: "Markdown",
    },
    {
      description: "Web-ready HTML document (.html)",
      extension: ".html",
      features: ["Web-ready", "Styled output", "Embeddable"],
      icon: Globe,
      id: "html",
      name: "HTML",
    },
    {
      description: "Microsoft Word compatible (.docx)",
      extension: ".docx",
      features: [
        "Professional formatting",
        "Collaborative editing",
        "Print-ready",
      ],
      icon: FileText,
      id: "docx",
      name: "Word Document",
    },
  ];

  const handleExport = () => {
    if (!selectedFormat) return;

    // In a real app, this would trigger the actual export
    const filename = exportOptions.customFilename || `content-${id}`;
    const format = exportFormats.find((f) => f.id === selectedFormat);

    console.log(`Exporting content ${id} as ${filename}${format?.extension}`);

    // Simulate download
    const element = document.createElement("a");
    const content = generateExportContent(selectedFormat);
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${filename}${format?.extension}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateExportContent = (format: string) => {
    const baseContent = {
      content:
        "# The Future of AI in Web Development\n\nArtificial intelligence is revolutionizing...",
      metadata: {
        author: "AI News Agent",
        date: "2024-01-16",
        tags: ["AI", "web development", "technology"],
      },
      title: "The Future of AI in Web Development",
    };

    switch (format) {
      case "markdown":
        return `# ${baseContent.title}\n\n${exportOptions.includeMetadata ? `**Author:** ${baseContent.metadata.author}\n**Date:** ${baseContent.metadata.date}\n**Tags:** ${baseContent.metadata.tags.join(", ")}\n\n` : ""}${baseContent.content}`;
      case "html":
        return `<!DOCTYPE html>\n<html>\n<head>\n<title>${baseContent.title}</title>\n</head>\n<body>\n<h1>${baseContent.title}</h1>\n${exportOptions.includeMetadata ? `<p><strong>Author:</strong> ${baseContent.metadata.author}</p>\n<p><strong>Date:</strong> ${baseContent.metadata.date}</p>\n<p><strong>Tags:</strong> ${baseContent.metadata.tags.join(", ")}</p>` : ""}\n<div>${baseContent.content.replace(/\n/g, "<br>")}</div>\n</body>\n</html>`;
      case "docx":
        return `${baseContent.title}\n\n${exportOptions.includeMetadata ? `Author: ${baseContent.metadata.author}\nDate: ${baseContent.metadata.date}\nTags: ${baseContent.metadata.tags.join(", ")}\n\n` : ""}${baseContent.content}`;
      default:
        return baseContent.content;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/auth">
                <h1 className="text-xl font-bold text-gray-900">BlogAI</h1>
              </Link>
              <div className="ml-6">
                <span className="text-gray-500">/ Export Content</span>
              </div>
            </div>
            <div className="flex items-center">
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
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Export Content</h2>
            <p className="mt-1 text-sm text-gray-600">
              Choose your preferred format and customize export options
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Format Selection */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Select Format
                </h3>
                <div className="space-y-4">
                  {exportFormats.map((format) => {
                    const Icon = format.icon;
                    return (
                      <div
                        className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${selectedFormat === format.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                        key={format.id}
                        onClick={() => setSelectedFormat(format.id)}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <Icon
                              className={`h-6 w-6 ${selectedFormat === format.id
                                ? "text-indigo-600"
                                : "text-gray-400"
                                }`}
                            />
                          </div>
                          <div className="ml-4 flex-1">
                            <h4
                              className={`text-lg font-medium ${selectedFormat === format.id
                                ? "text-indigo-900"
                                : "text-gray-900"
                                }`}
                            >
                              {format.name}
                            </h4>
                            <p
                              className={`text-sm ${selectedFormat === format.id
                                ? "text-indigo-700"
                                : "text-gray-600"
                                }`}
                            >
                              {format.description}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {format.features.map((feature) => (
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedFormat === format.id
                                    ? "bg-indigo-100 text-indigo-800"
                                    : "bg-gray-100 text-gray-800"
                                    }`}
                                  key={feature}
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Export Options
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Filename (optional)
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md border-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      onChange={(e) =>
                        setExportOptions({
                          ...exportOptions,
                          customFilename: e.target.value,
                        })
                      }
                      placeholder="my-article"
                      type="text"
                      value={exportOptions.customFilename}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Leave empty to use default naming
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        checked={exportOptions.includeMetadata}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        id="includeMetadata"
                        onChange={(e) =>
                          setExportOptions({
                            ...exportOptions,
                            includeMetadata: e.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      <label
                        className="ml-2 block text-sm text-gray-900"
                        htmlFor="includeMetadata"
                      >
                        Include metadata (author, date, etc.)
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        checked={exportOptions.includeTags}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        id="includeTags"
                        onChange={(e) =>
                          setExportOptions({
                            ...exportOptions,
                            includeTags: e.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      <label
                        className="ml-2 block text-sm text-gray-900"
                        htmlFor="includeTags"
                      >
                        Include tags and categories
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        checked={exportOptions.includeImages}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        id="includeImages"
                        onChange={(e) =>
                          setExportOptions({
                            ...exportOptions,
                            includeImages: e.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      <label
                        className="ml-2 block text-sm text-gray-900"
                        htmlFor="includeImages"
                      >
                        Include image references
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview & Actions */}
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Preview
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Content ID:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      #{id}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Format:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {selectedFormat
                        ? exportFormats.find((f) => f.id === selectedFormat)
                          ?.name
                        : "Not selected"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Filename:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {exportOptions.customFilename || `content-${id}`}
                      {selectedFormat
                        ? exportFormats.find((f) => f.id === selectedFormat)
                          ?.extension
                        : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <Button
                  className="w-full"
                  disabled={!selectedFormat}
                  onClick={handleExport}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Content
                </Button>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  {selectedFormat
                    ? "Ready to export"
                    : "Select a format to continue"}
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  💡 Export Tips
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Markdown is great for version control</li>
                  <li>• HTML includes styling and formatting</li>
                  <li>• DOCX works well for collaboration</li>
                  <li>• Include metadata for better organization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
