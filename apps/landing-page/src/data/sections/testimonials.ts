import brandConfig from "@packages/brand";
export interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  results: string;
}

export const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Content Marketing Director",
    company: "TechFlow Agency",
    content: `${brandConfig.name} transformed our agency operations. We're now handling 3x more clients with the same team size. The AI agents maintain perfect brand consistency across all our client accounts.`,
    rating: 5,
    results: "3x client capacity, 70% cost reduction",
  },
  {
    name: "Marcus Rodriguez",
    role: "Tech Blogger",
    company: "DevInsights Blog",
    content:
      "I went from struggling to publish twice a week to consistently publishing daily. My blog traffic increased 300% in just 3 months. The SEO optimization is incredible.",
    rating: 5,
    results: "300% traffic increase, daily publishing",
  },
  {
    name: "Emily Watson",
    role: "Marketing Manager",
    company: "SaaS Startup",
    content: `Our content marketing was inconsistent before ${brandConfig.name}. Now we publish 20+ SEO-optimized posts monthly while I focus on strategy instead of writing.`,
    rating: 5,
    results: "20+ posts/month, 94% SEO score avg",
  },
];
