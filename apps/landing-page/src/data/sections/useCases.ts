export interface UseCase {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  stats: { label: string; value: string }[];
  cta: string;
}

export interface CommonBenefit {
  icon: string;
  title: string;
  description: string;
}

export const useCases: UseCase[] = [
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="7" width="18" height="13" rx="2" stroke-width="2"/><path d="M16 3v4M8 3v4M3 17h18" stroke-width="2"/></svg>`,
    title: "Content Agencies",
    subtitle: "Scale client content production effortlessly",
    description:
      "Manage multiple client brands with dedicated AI agents. Maintain brand consistency while dramatically reducing content creation time and costs.",
    benefits: [
      "Manage 10+ client brands simultaneously",
      "Reduce content creation costs by 70%",
      "Maintain consistent brand voice per client",
      "Scale team productivity without hiring",
      "Automated client reporting and analytics",
    ],
    stats: [
      { label: "Time Saved", value: "25+ hrs/week" },
      { label: "Cost Reduction", value: "70%" },
      { label: "Client Capacity", value: "3x more" },
    ],
    cta: "Perfect for Agencies",
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="8" r="4" stroke-width="2"/><path d="M16 21v-2a4 4 0 0 0-8 0v2" stroke-width="2"/></svg>`,
    title: "Individual Bloggers",
    subtitle: "Consistent, high-quality content creation",
    description:
      "Never miss a publishing deadline again. Create SEO-optimized blog posts that match your unique voice and engage your audience consistently.",
    benefits: [
      "Maintain consistent publishing schedule",
      "SEO-optimized content for better rankings",
      "Overcome writer's block permanently",
      "Focus on strategy, not writing",
      "Build audience faster with quality content",
    ],
    stats: [
      { label: "Publishing Consistency", value: "100%" },
      { label: "SEO Score Avg", value: "94%" },
      { label: "Content Output", value: "5x more" },
    ],
    cta: "Perfect for Bloggers",
  },
];

export const commonBenefits: CommonBenefit[] = [
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 6v6l4 2" stroke-width="2"/></svg>`,
    title: "Save 15+ Hours Weekly",
    description:
      "Cut content creation time from hours to minutes while maintaining quality and consistency.",
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 8v4l3 3" stroke-width="2"/></svg>`,
    title: "SEO-Optimized Content",
    description:
      "Every piece of content is optimized for search engines with proper keyword integration and structure.",
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 17l6.5-6.5a4.978 4.978 0 0 1 7 0L21 17" stroke-width="2"/><circle cx="12" cy="8" r="4" stroke-width="2"/></svg>`,
    title: "Consistent Publishing",
    description:
      "Never miss a deadline with automated content generation and scheduling capabilities.",
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="7" cy="7" r="3" stroke-width="2"/><circle cx="17" cy="7" r="3" stroke-width="2"/><circle cx="12" cy="17" r="3" stroke-width="2"/><path d="M7 10v4l5 3l5-3v-4" stroke-width="2"/></svg>`,
    title: "Team Collaboration",
    description:
      "Built-in review workflows and team management tools for seamless collaboration.",
  },
];
