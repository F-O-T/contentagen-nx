import type { TrendsConfig } from "./types";

interface DefaultInsightDef {
   name: string;
   description: string;
   type: "trends" | "funnels" | "retention";
   config: TrendsConfig; // all default insights are trends for now
   defaultSize: "sm" | "md" | "lg" | "full";
}

export const DEFAULT_INSIGHTS: DefaultInsightDef[] = [
   {
      name: "Page Views",
      description: "Daily page views over the last 30 days",
      type: "trends",
      config: {
         type: "trends",
         series: [
            { event: "content.page.view", math: "count", label: "Page Views" },
         ],
         dateRange: { type: "relative", value: "30d" },
         interval: "day",
         chartType: "line",
         compare: true,
         filters: [],
      },
      defaultSize: "lg",
   },
   {
      name: "Unique Visitors",
      description: "Daily unique visitors over the last 30 days",
      type: "trends",
      config: {
         type: "trends",
         series: [
            {
               event: "content.page.view",
               math: "unique_users",
               label: "Unique Visitors",
            },
         ],
         dateRange: { type: "relative", value: "30d" },
         interval: "day",
         chartType: "line",
         compare: true,
         filters: [],
      },
      defaultSize: "lg",
   },
   {
      name: "Content Created",
      description: "Content created this month",
      type: "trends",
      config: {
         type: "trends",
         series: [
            {
               event: "content.created",
               math: "count",
               label: "Content Created",
            },
         ],
         dateRange: { type: "relative", value: "this_month" },
         interval: "day",
         chartType: "bar",
         compare: false,
         filters: [],
      },
      defaultSize: "sm",
   },
   {
      name: "Top Content",
      description: "Most viewed content in the last 30 days",
      type: "trends",
      config: {
         type: "trends",
         series: [
            { event: "content.page.view", math: "count", label: "Views" },
         ],
         dateRange: { type: "relative", value: "30d" },
         interval: "day",
         chartType: "bar",
         breakdown: { property: "contentId", type: "event" },
         compare: false,
         filters: [],
      },
      defaultSize: "full",
   },
   {
      name: "AI Usage",
      description: "AI feature usage over the last 30 days",
      type: "trends",
      config: {
         type: "trends",
         series: [
            { event: "ai.completion", math: "count", label: "Completions" },
            {
               event: "ai.chat_message",
               math: "count",
               label: "Chat Messages",
            },
            {
               event: "ai.agent_action",
               math: "count",
               label: "Agent Actions",
            },
         ],
         dateRange: { type: "relative", value: "30d" },
         interval: "day",
         chartType: "line",
         compare: true,
         filters: [],
      },
      defaultSize: "lg",
   },
   {
      name: "SDK Requests",
      description: "SDK API requests over the last 30 days",
      type: "trends",
      config: {
         type: "trends",
         series: [
            { event: "sdk.author.fetched", math: "count", label: "Author" },
            { event: "sdk.content.listed", math: "count", label: "List" },
            { event: "sdk.content.fetched", math: "count", label: "Content" },
            { event: "sdk.image.fetched", math: "count", label: "Image" },
         ],
         dateRange: { type: "relative", value: "30d" },
         interval: "day",
         chartType: "area",
         compare: false,
         filters: [],
      },
      defaultSize: "lg",
   },
   {
      name: "Conversion Rate",
      description: "CTA click rate from page views",
      type: "trends",
      config: {
         type: "trends",
         series: [
            { event: "content.page.view", math: "count", label: "Views" },
            { event: "content.cta.click", math: "count", label: "Clicks" },
         ],
         dateRange: { type: "relative", value: "30d" },
         interval: "day",
         chartType: "number",
         formula: "B/A*100",
         compare: true,
         filters: [],
      },
      defaultSize: "sm",
   },
   {
      name: "Credit Usage",
      description: "Billable event costs this month",
      type: "trends",
      config: {
         type: "trends",
         series: [
            { event: "content.page.view", math: "count", label: "Content" },
            { event: "ai.completion", math: "count", label: "AI" },
            { event: "form.submitted", math: "count", label: "Forms" },
         ],
         dateRange: { type: "relative", value: "this_month" },
         interval: "day",
         chartType: "area",
         compare: false,
         filters: [],
      },
      defaultSize: "full",
   },
];
