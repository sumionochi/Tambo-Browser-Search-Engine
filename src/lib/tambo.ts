// lib/tambo.ts
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { analyticsGraphComponent } from "@/components/interactable/AnalyticsGraph";
import { locationMapComponent } from "@/components/interactable/LocationMap";

// Import components only (client-safe)
import { Graph, graphSchema } from "@/components/tambo/graph";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import { searchResultsComponent } from "@/components/generative/SearchResults";
import { pexelsGridComponent } from "@/components/generative/PexelsGrid";
import { repoExplorerComponent } from "@/components/generative/RepoExplorer";
import { gitHubArchitectureDiagramComponent } from "@/components/generative/GitHubArchitectureDiagram"; // ← NEW

// Import example services (keep these if they're client-safe)
import {
  getCountryPopulations,
  getGlobalPopulationTrend,
} from "@/services/population-stats";

export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description: "A component that displays options as clickable cards.",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
  {
    name: "Graph",
    description: "A component that renders various types of charts",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description: "A component that displays options as clickable cards",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
  searchResultsComponent,
  pexelsGridComponent,
  repoExplorerComponent,
  analyticsGraphComponent,
  locationMapComponent,
  gitHubArchitectureDiagramComponent,
];

// Client-safe tool wrappers that call API routes
export const tools: TamboTool[] = [
  // Example tools (keep if client-safe)
  {
    name: "countryPopulation",
    description: "Get population statistics by country",
    tool: getCountryPopulations,
    inputSchema: z.object({
      continent: z.string().optional(),
      sortBy: z.enum(["population", "growthRate"]).optional(),
      limit: z.number().optional(),
      order: z.enum(["asc", "desc"]).optional(),
    }),
    outputSchema: z.array(
      z.object({
        countryCode: z.string(),
        countryName: z.string(),
        continent: z.enum([
          "Asia",
          "Africa",
          "Europe",
          "North America",
          "South America",
          "Oceania",
        ]),
        population: z.number(),
        year: z.number(),
        growthRate: z.number(),
      })
    ),
  },
  {
    name: "globalPopulation",
    description: "Get global population trends",
    tool: getGlobalPopulationTrend,
    inputSchema: z.object({
      startYear: z.number().optional(),
      endYear: z.number().optional(),
    }),
    outputSchema: z.array(
      z.object({
        year: z.number(),
        population: z.number(),
        growthRate: z.number(),
      })
    ),
  },
  {
    name: "add_to_collection",
    description: `Bookmark search results to a collection by specifying which result numbers to save.

When user says "bookmark the first 3 results", pass:
- The search query that was used
- The indices of items to save (0, 1, 2 for first 3)
- Collection name

The system will automatically extract the URLs and details for you.`,

    tool: async (input: any) => {
      const response = await fetch("/api/tools/collection/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return response.json();
    },

    inputSchema: z.object({
      collectionName: z.string().describe("Name of the collection"),
      searchQuery: z
        .string()
        .describe(
          "The search query that generated the results (e.g., 'React tutorials')"
        ),
      searchType: z
        .enum(["web", "pexels", "github"])
        .describe(
          "Type of search: 'web' for Google, 'pexels' for images, 'github' for repositories"
        ),
      indices: z
        .array(z.number())
        .describe(
          "Array of result indices to bookmark (e.g., [0, 1, 2] for first 3 results)"
        ),
    }),

    outputSchema: z.object({
      success: z.boolean(),
      collectionId: z.string(),
      itemsAdded: z.number(),
      message: z.string(),
    }),
  },
  {
    name: "create_calendar_event",
    description:
      "Create a calendar event with optional links to collections. Use when user wants to schedule time or set reminders.",
    tool: async (input: any) => {
      const response = await fetch("/api/tools/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return response.json();
    },
    inputSchema: z.object({
      title: z.string().describe("Event title"),
      datetime: z.string().describe("ISO datetime string for the event"),
      note: z.string().optional().describe("Additional notes"),
      linkedCollectionId: z
        .string()
        .optional()
        .describe("ID of linked collection"),
      linkedItems: z.array(z.string()).optional().describe("Array of item IDs"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      eventId: z.string(),
      message: z.string(),
    }),
  },
  {
    name: "create_note",
    description:
      "Create a text note. Can link to search queries or collections. Use when user wants to save information as text.",
    tool: async (input: any) => {
      const response = await fetch("/api/tools/note/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return response.json();
    },
    inputSchema: z.object({
      content: z.string().describe("Note content"),
      sourceSearch: z
        .string()
        .optional()
        .describe("Search query that created this note"),
      linkedCollectionId: z
        .string()
        .optional()
        .describe("ID of linked collection"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      noteId: z.string(),
      message: z.string(),
    }),
  },
  {
    name: "generate_image_variations",
    description: `Edit an image from the most recent Pexels search.

When user says "edit the 9th image":
1. Convert position to zero-based index: 1st=0, 2nd=1, 9th=8, etc.
2. Call this tool with imageIndex and editPrompt
3. Use variationCount=1 by default (only generate if user asks for multiple)

After success, respond with ONLY:
"✅ Image variation generated! Click the **Studio** tab to view it."

DO NOT add any other text or explanations.`,

    tool: async (input: any) => {
      const response = await fetch("/api/tools/image/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return response.json();
    },

    inputSchema: z.object({
      imageIndex: z
        .number()
        .min(0)
        .describe("Zero-based index: 1st=0, 2nd=1, 9th=8, etc."),
      editPrompt: z.string().describe("Editing instructions"),
      variationCount: z
        .number()
        .optional()
        .default(1)
        .describe("Number of variations (default: 1, max: 10)"),
    }),

    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      variationsGenerated: z.number(),
    }),
  },
];
