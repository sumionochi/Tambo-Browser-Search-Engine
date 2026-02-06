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
import { gitHubArchitectureDiagramComponent } from "@/components/generative/GitHubArchitectureDiagram";

// Phase 3: Workflow components (created in Steps 8-9)
import { workflowExecutorComponent } from "@/components/generative/WorkflowExecutor";
import { dynamicReportComponent } from "@/components/generative/DynamicReport";

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
  searchResultsComponent,
  pexelsGridComponent,
  repoExplorerComponent,
  analyticsGraphComponent,
  locationMapComponent,
  gitHubArchitectureDiagramComponent,

  // Phase 3: Workflow components
  workflowExecutorComponent,
  dynamicReportComponent,
];

// Client-safe tool wrappers that call API routes
export const tools: TamboTool[] = [
  // ──────────────────────────────────────────
  // Example tools
  // ──────────────────────────────────────────
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

  // ──────────────────────────────────────────
  // Existing tools
  // ──────────────────────────────────────────
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

  // ──────────────────────────────────────────
  // Phase 3: AI Workflow Tools
  // ──────────────────────────────────────────

  // Step 5: Execute Research Workflow
  {
    name: "execute_research_workflow",
    description: `Start an automated multi-step research workflow. Use this when the user wants to:
- Research and compare multiple things (e.g., "Compare top 5 AI tools")
- Conduct in-depth research on a topic (e.g., "Research React alternatives")
- Analyze trends or data across sources (e.g., "Analyze GitHub activity of JS frameworks")
- Create a report from web/GitHub/image research

The system will:
1. Break the goal into discrete research steps
2. Execute each step automatically (search, extract, analyze)
3. Generate a structured report with findings

After calling this tool, ALWAYS render the WorkflowExecutor component with the returned workflowId and steps so the user can see live progress.

Example response after tool returns:
"I've started a research workflow with {totalSteps} steps. Here's the live progress:"
[Render WorkflowExecutor component]`,

    tool: async (input: any) => {
      const response = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return response.json();
    },

    inputSchema: z.object({
      goal: z
        .string()
        .describe(
          "Natural language research goal (e.g., 'Compare top 5 React state management libraries by GitHub stars and npm downloads')"
        ),
      sources: z
        .array(z.enum(["google", "github", "pexels"]))
        .optional()
        .default(["google"])
        .describe(
          "Which search sources to use. Use 'google' for web search, 'github' for repos, 'pexels' for images."
        ),
      depth: z
        .enum(["quick", "standard", "deep"])
        .optional()
        .default("standard")
        .describe(
          "Research depth: 'quick' (3 steps, 5 results), 'standard' (5 steps, 10 results), 'deep' (8 steps, 20 results)"
        ),
      outputFormat: z
        .enum(["comparison", "analysis", "timeline", "summary"])
        .optional()
        .default("summary")
        .describe(
          "Report format: 'comparison' for side-by-side, 'analysis' for deep dive, 'timeline' for chronological, 'summary' for overview"
        ),
    }),

    outputSchema: z.object({
      success: z.boolean(),
      workflowId: z.string(),
      title: z.string(),
      status: z.string(),
      totalSteps: z.number(),
      steps: z.array(
        z.object({
          index: z.number(),
          type: z.string(),
          title: z.string(),
          description: z.string(),
          status: z.string(),
        })
      ),
      message: z.string(),
    }),
  },

  // Step 6: Generate Report from Collection
  {
    name: "generate_report_from_collection",
    description: `Generate an AI research report from an existing collection. Use this when the user wants to:
- Summarize a collection they've built up (e.g., "Summarize my AI Tools collection")
- Create a comparison from bookmarked items (e.g., "Compare everything in my React collection")
- Analyze collected research (e.g., "Create an analysis from my research collection")

The system will fetch all items from the collection, use AI to synthesize them,
and generate a structured report with sections, tables, and insights.

After success, render the DynamicReport component with the returned reportId.`,

    tool: async (input: any) => {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return response.json();
    },

    inputSchema: z.object({
      collectionId: z
        .string()
        .describe("ID of the collection to generate report from"),
      reportType: z
        .enum(["summary", "comparison", "analysis", "timeline"])
        .optional()
        .default("summary")
        .describe("Type of report to generate"),
      title: z
        .string()
        .optional()
        .describe(
          "Custom title for the report (optional, AI will generate one if not provided)"
        ),
    }),

    outputSchema: z.object({
      success: z.boolean(),
      reportId: z.string(),
      report: z.object({
        id: z.string(),
        title: z.string(),
        summary: z.string(),
        format: z.string(),
      }),
      message: z.string(),
    }),
  },

  // Step 7: Get Workflow Status
  {
    name: "get_workflow_status",
    description: `Check the current status of a running research workflow. Use this when:
- The user asks about workflow progress (e.g., "How's my research going?")
- You need to check if a workflow has completed before showing results
- The user wants to see what step a workflow is on

Returns real-time progress including per-step status and completion percentage.
If the workflow is complete and has a report, render the DynamicReport component.`,

    tool: async (input: any) => {
      const response = await fetch(
        `/api/workflows/${input.workflowId}/status`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      return response.json();
    },

    inputSchema: z.object({
      workflowId: z.string().describe("ID of the workflow to check status for"),
    }),

    outputSchema: z.object({
      workflowId: z.string(),
      title: z.string(),
      status: z.string(),
      currentStep: z.number(),
      totalSteps: z.number(),
      progress: z.number(),
      steps: z.array(
        z.object({
          index: z.number(),
          type: z.string(),
          title: z.string(),
          status: z.string(),
          error: z.string().nullable(),
        })
      ),
      reportId: z.string().nullable(),
      reportTitle: z.string().nullable(),
      errorMessage: z.string().nullable(),
    }),
  },
];
