import { Bot, Workflow, FileText, BarChart3 } from "@lucide/astro";

export interface Feature {
  icon: any;
  title: string;
  description: string;
  badge: string;
  benefits: string[];
  visual: string;
}

export const features: Feature[] = [
  {
    icon: Bot,
    title: "AI Agent Creation",
    description:
      "Configure intelligent content agents with custom tone, target audience, keywords, and brand guidelines. Each agent learns your style and maintains consistency across all content.",
    badge: "Core Feature",
    benefits: [
      "Custom tone & voice settings",
      "Audience targeting parameters",
      "SEO keyword integration",
      "Brand guideline compliance",
    ],
    visual: `<div class='bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-4 h-32 flex items-center justify-center'>
      <div class='text-center'>
        <svg class='w-8 h-8 text-purple-600 mx-auto mb-2' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' fill='currentColor'/></svg>
        <div class='text-sm font-medium'>Tech Blog Agent</div>
        <div class='text-xs text-gray-600'>Professional • B2B • SEO-focused</div>
      </div>
    </div>`,
  },
  {
    icon: Workflow,
    title: "Draft Generation Workflow",
    description:
      "Transform simple briefs into comprehensive blog drafts. Input your topic, keywords, and requirements—get publication-ready content in minutes, not hours.",
    badge: "Automated",
    benefits: [
      "Brief-to-draft automation",
      "Multi-format output support",
      "Real-time generation tracking",
      "Bulk content creation",
    ],
    visual: `<div class='bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-4 h-32 flex items-center justify-center'>
      <div class='space-y-2 w-full'>
        <div class='h-2 bg-green-200 rounded w-full'></div>
        <div class='h-2 bg-green-400 rounded w-3/4'></div>
        <div class='h-2 bg-green-600 rounded w-1/2'></div>
        <div class='text-xs text-center text-green-700 font-medium'>Generating...</div>
      </div>
    </div>`,
  },
  {
    icon: FileText,
    title: "Manual Review & Export",
    description:
      "Review, edit, and export your content in multiple formats. Support for Markdown, HTML, DOCX, and direct publishing to popular platforms.",
    badge: "Flexible",
    benefits: [
      "Multi-format export options",
      "Built-in editing interface",
      "Version control & history",
      "Direct platform publishing",
    ],
    visual: `<div class='bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg p-4 h-32 flex items-center justify-center'>
      <div class='grid grid-cols-3 gap-2 w-full'>
        <div class='bg-orange-200 rounded p-2 text-center text-xs'>MD</div>
        <div class='bg-orange-300 rounded p-2 text-center text-xs'>HTML</div>
        <div class='bg-orange-400 rounded p-2 text-center text-xs'>DOCX</div>
      </div>
    </div>`,
  },
  {
    icon: BarChart3,
    title: "Project Dashboard",
    description:
      "Comprehensive dashboard for managing multiple content agents, tracking performance, and organizing projects. Perfect for agencies handling multiple clients.",
    badge: "Management",
    benefits: [
      "Multi-agent management",
      "Performance analytics",
      "Client project organization",
      "Team collaboration tools",
    ],
    visual: `<div class='bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg p-4 h-32 flex items-center justify-center'>
      <div class='w-full space-y-1'>
        <div class='flex justify-between items-center'>
          <div class='text-xs'>Content Performance</div>
          <div class='text-xs text-blue-600'>↗ 24%</div>
        </div>
        <div class='h-16 bg-blue-200 rounded relative overflow-hidden'>
          <div class='absolute bottom-0 left-0 w-1/4 bg-blue-400 h-8'></div>
          <div class='absolute bottom-0 left-1/4 w-1/4 bg-blue-500 h-12'></div>
          <div class='absolute bottom-0 left-2/4 w-1/4 bg-blue-600 h-6'></div>
          <div class='absolute bottom-0 left-3/4 w-1/4 bg-blue-700 h-14'></div>
        </div>
      </div>
    </div>`,
  },
];
