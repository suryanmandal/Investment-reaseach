import { StateGraph, Annotation } from "@langchain/langgraph";
import { getChatModel, searchTavily, runPythonAnalysis, TavilySearchResult } from "./tools";

// Define the State Channel Schema with Strategy inputs and Safety Score outputs
export const ResearchState = Annotation.Root({
  ticker: Annotation<string>(),
  companyName: Annotation<string>(),
  // Chosen model provider ("gemini" | "openai" | "claude")
  modelProvider: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "gemini",
  }),
  // Strategy Profiler Parameters
  strategyHorizon: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "Medium-Term",
  }),
  strategyRisk: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "Balanced",
  }),
  revenueWeight: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 33.3,
  }),
  riskWeight: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 33.3,
  }),
  sentimentWeight: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 33.4,
  }),
  // Outputs
  safetyScore: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
  safetyBreakdown: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "{}",
  }),
  queries: Annotation<string[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),
  searchResults: Annotation<Record<string, TavilySearchResult[]>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  revenueGrowthAnalysis: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "",
  }),
  risksAnalysis: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "",
  }),
  sentimentCompetitorsAnalysis: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "",
  }),
  verificationLog: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  verificationPassed: Annotation<boolean>({
    reducer: (x, y) => y,
    default: () => false,
  }),
  verdict: Annotation<"Bullish" | "Bearish" | "Neutral" | null>({
    reducer: (x, y) => y,
    default: () => null,
  }),
  reasoningReport: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "",
  }),
  retryCount: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),
  currentStep: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "",
  }),
  logs: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// Clean JSON extraction helper resilient to unescaped control characters
function extractJson(text: string): any {
  // Strip markdown wraps if present
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Failed to extract JSON structure from response");
  }
  
  const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
  
  // Escape raw newlines/control characters inside string values
  let resultStr = "";
  let inQuote = false;
  let escapeActive = false;
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    
    if (char === '"' && !escapeActive) {
      inQuote = !inQuote;
      resultStr += char;
    } else if (char === '\\' && !escapeActive) {
      escapeActive = true;
      resultStr += char;
    } else {
      escapeActive = false;
      if (inQuote) {
        if (char === '\n') {
          resultStr += '\\n';
        } else if (char === '\r') {
          resultStr += '\\r';
        } else if (char === '\t') {
          resultStr += '\\t';
        } else {
          resultStr += char;
        }
      } else {
        resultStr += char;
      }
    }
  }

  // Remove potential trailing commas before closing braces/brackets
  resultStr = resultStr.replace(/,\s*([}\]])/g, "$1");

  return JSON.parse(resultStr);
}

// 1. Query Planner Node
async function queryPlannerNode(state: typeof ResearchState.State) {
  const model = getChatModel(state.modelProvider);
  const ticker = state.ticker;
  const companyName = state.companyName || ticker;
  const risk = state.strategyRisk;
  const horizon = state.strategyHorizon;

  const prompt = `You are a financial research query planner. Given a company (Ticker: ${ticker}, Name: ${companyName}), generate exactly 3 targeted search queries to fetch financial data, sentiment, and risks.
  Current year is 2026.
  
  TAILOR THE QUERIES TO THIS INVESTOR PROFILE:
  - Risk profile: ${risk}
  - Horizon: ${horizon}
  
  (Example: If risk is Conservative, queries should target debt, liabilities, and SEC risk factors. If Aggressive, focus on industry trends and product launch catalysts).
  
  Return your response strictly in the following JSON format:
  {
    "companyName": "Full Company Name",
    "queries": [
      "query for financials and growth based on profile",
      "query for risk factors and headwinds based on profile",
      "query for competitor comparison and news based on profile"
    ]
  }
  `;

  try {
    const response = await model.invoke(prompt);
    const result = extractJson(response.content as string);
    const queries = result.queries || [];
    const resolvedName = result.companyName || companyName;

    return {
      queries,
      companyName: resolvedName,
      currentStep: "planning",
      logs: [
        `Resolved company name: "${resolvedName}"`,
        `Selected Profile: Horizon = ${horizon}, Risk = ${risk}`,
        `Generated 3 profile-tailored queries:\n${queries.map((q: string, i: number) => `  ${i + 1}. "${q}"`).join("\n")}`,
      ],
    };
  } catch (error: any) {
    const fallbackQueries = [
      `${companyName} (${ticker}) quarterly financial results revenue growth earnings 2025 2026`,
      `${companyName} (${ticker}) risks headwinds liabilities debt SEC filings`,
      `${companyName} (${ticker}) competitor comparison market share news`,
    ];
    return {
      queries: fallbackQueries,
      currentStep: "planning",
      logs: [
        `Query planning encountered an error. Using profile fallbacks.`,
        `Generated queries:\n${fallbackQueries.map((q, i) => `  ${i + 1}. "${q}"`).join("\n")}`,
      ],
    };
  }
}

// 2. Search Executor Node
async function searchExecutorNode(state: typeof ResearchState.State) {
  const queries = state.queries;
  const newResults: Record<string, TavilySearchResult[]> = {};
  const logs: string[] = [`Running web searches for ${queries.length} queries...`];

  const searchPromises = queries.map(async (query) => {
    try {
      const response = await searchTavily(query);
      return { query, results: response.results };
    } catch (e: any) {
      console.error(`Search failed for query "${query}":`, e);
      return { query, results: [] as TavilySearchResult[] };
    }
  });

  const searchResponses = await Promise.all(searchPromises);

  for (const { query, results } of searchResponses) {
    newResults[query] = results;
    logs.push(`Completed search: "${query}" (Found ${results.length} sources)`);
  }

  return {
    searchResults: newResults,
    currentStep: "researching",
    logs,
  };
}

// 3. Analyzer Node
async function analyzerNode(state: typeof ResearchState.State) {
  const model = getChatModel(state.modelProvider);
  const companyName = state.companyName || state.ticker;
  const searchData = JSON.stringify(state.searchResults, null, 2);
  const risk = state.strategyRisk;
  const horizon = state.strategyHorizon;

  const analysisPrompt = `You are a Senior Financial Analyst. Review the following web search data for ${companyName} (${state.ticker}).
  
  TAILOR YOUR ANALYSIS FOR THE FOLLOWING INVESTOR:
  - Risk Profile: ${risk}
  - Investment Horizon: ${horizon}
  
  (Example: If risk is Conservative, your analysis should emphasize financial health, debt structures, and potential downside risks. If Aggressive, focus on market capitalization, product pipelines, and upward catalysts).

  ---
  WEB SEARCH RESULTS:
  ${searchData}
  ---

  Analyze the company based on three pillars:
  1. **Revenue & Growth**: Assess recent quarterly earnings (revenues, margins, guidance, growth rates).
  2. **Risks & Headwinds**: Highlight key risk factors, regulatory issues, macro headwinds, or corporate controversies.
  3. **Competitors & Market Sentiment**: Evaluate competitor comparisons, analyst sentiment, and overall market headlines.

  Provide a detailed evaluation for each pillar. You MUST rely only on the facts present in the search results. If data for a pillar is missing, state it explicitly.

  Return your response strictly in the following JSON format:
  {
    "revenueGrowth": "Detailed analysis of revenue, earnings and growth metrics...",
    "risks": "Detailed analysis of risks, bottlenecks, SEC headwinds...",
    "sentimentCompetitors": "Detailed analysis of competitor comparisons and market sentiment..."
  }
  `;

  try {
    const response = await model.invoke(analysisPrompt);
    const analysis = extractJson(response.content as string);

    return {
      revenueGrowthAnalysis: analysis.revenueGrowth || "No revenue analysis generated.",
      risksAnalysis: analysis.risks || "No risks analysis generated.",
      sentimentCompetitorsAnalysis: analysis.sentimentCompetitors || "No competitor analysis generated.",
      currentStep: "analyzing",
      logs: [`Pillar analysis complete. Evaluated using the ${risk}/${horizon} profile.`],
    };
  } catch (error: any) {
    return {
      revenueGrowthAnalysis: "Analysis failed to parse.",
      risksAnalysis: "Analysis failed to parse.",
      sentimentCompetitorsAnalysis: "Analysis failed to parse.",
      currentStep: "analyzing",
      logs: [`Analyzer failed to parse JSON output: ${error.message}`],
    };
  }
}

// 4. Validator Node (Check-Validate Loop)
async function validatorNode(state: typeof ResearchState.State) {
  const model = getChatModel(state.modelProvider);
  const companyName = state.companyName || state.ticker;

  const validationPrompt = `You are a strict Investment Research Auditor. You must verify if the generated financial analysis is factually accurate, consistent, and sufficiently covers recent financial figures.
  
  Company: ${companyName} (${state.ticker})
  Current Year: 2026
  
  ANALYSES TO AUDIT:
  - Revenue & Growth Analysis:
  ${state.revenueGrowthAnalysis}
  
  - Risks & Headwinds Analysis:
  ${state.risksAnalysis}
  
  - Competitors & Sentiment Analysis:
  ${state.sentimentCompetitorsAnalysis}

  RAW SEARCH SOURCE SNIPPETS:
  ${JSON.stringify(state.searchResults, null, 2)}

  YOUR CRITERIA:
  1. Are there any critical data gaps? (e.g., missing recent quarterly revenue, margins, or EPS numbers for late 2025/2026)?
  2. Are there any contradictions between the analyses and the raw source snippets?
  3. Is there a lack of mention of key competitors or major risk factors?

  If there are issues, you must reject the validation and specify exactly what is missing or incorrect, and provide 1 or 2 search queries that will help find that missing information.
  If the analysis is solid, factually consistent, and contains adequate details, pass it.

  Return your response strictly in the following JSON format:
  {
    "passed": true/false,
    "errors": ["list of issues found, if any"],
    "newQueries": ["highly targeted queries to fetch missing information, if passed is false"]
  }
  `;

  try {
    const response = await model.invoke(validationPrompt);
    const validation = extractJson(response.content as string);
    const passed = validation.passed === true;
    const errors = validation.errors || [];
    const newQueries = validation.newQueries || [];

    const logs: string[] = [];
    if (passed) {
      logs.push("✅ Verification Audit PASSED: Analyses are factually consistent and complete.");
    } else {
      logs.push(`⚠️ Verification Audit FAILED (Retry #${state.retryCount + 1}):`);
      errors.forEach((err: string) => logs.push(`  - ${err}`));
      if (newQueries.length > 0) {
        logs.push(`Generated refined queries for research expansion: ${newQueries.join(", ")}`);
      }
    }

    return {
      verificationPassed: passed,
      verificationLog: errors,
      queries: passed ? [] : newQueries,
      retryCount: passed ? 0 : 1,
      currentStep: passed ? "verifying_passed" : "verifying_failed",
      logs,
    };
  } catch (error: any) {
    return {
      verificationPassed: true,
      verificationLog: [`Validation failed to execute correctly: ${error.message}`],
      queries: [],
      retryCount: 0,
      currentStep: "verifying_passed",
      logs: [`Audit execution error: ${error.message}. Proceeding with current data.`],
    };
  }
}

// 5. Report Generator Node
async function reportGeneratorNode(state: typeof ResearchState.State) {
  const model = getChatModel(state.modelProvider);
  const companyName = state.companyName || state.ticker;
  const risk = state.strategyRisk;
  const horizon = state.strategyHorizon;

  // Run the Python Financial Analytics Engine as a child process
  const pythonPayload = {
    revenueGrowthAnalysis: state.revenueGrowthAnalysis,
    risksAnalysis: state.risksAnalysis,
    sentimentCompetitorsAnalysis: state.sentimentCompetitorsAnalysis,
    strategyHorizon: horizon,
    strategyRisk: risk,
    revenueWeight: state.revenueWeight,
    riskWeight: state.riskWeight,
    sentimentWeight: state.sentimentWeight,
  };

  const pyResults = await runPythonAnalysis(pythonPayload);
  const safetyScore = pyResults.safetyScore || 70;
  const safetyBreakdown = JSON.stringify(pyResults.breakdown || {});

  const synthesisPrompt = `You are a Senior Portfolio Manager and Investment Writer. Synthesize the finalized financial analysis of ${companyName} (${state.ticker}) into a premium quality investment thesis report.
  
  INVESTOR STRATEGY PROFILE:
  - Risk Profile: ${risk}
  - Horizon: ${horizon}
  - Calculated InsideAlpha Safety Index (computed via python): ${safetyScore}/100

  REVENUE & GROWTH ANALYSIS:
  ${state.revenueGrowthAnalysis}
  
  RISKS & HEADWINDS ANALYSIS:
  ${state.risksAnalysis}
  
  COMPETITORS & SENTIMENT ANALYSIS:
  ${state.sentimentCompetitorsAnalysis}

  Based on these findings, you must issue a final rating: either "Bullish", "Bearish", or "Neutral".
  
  Structure your Markdown Report beautifully. Integrate the "Safety Index Score: ${safetyScore}/100" at the top of the Investment Verdict section.
  Include:
  1. **Executive Summary**: Clear thesis statement tailored to the ${risk}/${horizon} profile.
  2. **Revenue & Growth Outlook**: Core financial metrics (revenue, EPS, margins, growth projections).
  3. **Risk Profile**: Analysis of key operational, market, or legal risks.
  4. **Competitive Landscape**: Positioning compared to main rivals.
  5. **Investment Verdict & Catalysts**: Rationale for the rating, specific catalysts (upward or downward) to watch.

  Return your response strictly in the following JSON format:
  {
    "verdict": "Bullish" | "Bearish" | "Neutral",
    "reasoningReport": "Markdown formatted report here..."
  }
  `;

  try {
    const response = await model.invoke(synthesisPrompt);
    const synthesis = extractJson(response.content as string);
    const verdict = synthesis.verdict || "Neutral";
    const reasoningReport = synthesis.reasoningReport || "No report generated.";

    return {
      verdict: verdict as "Bullish" | "Bearish" | "Neutral",
      reasoningReport,
      safetyScore,
      safetyBreakdown,
      currentStep: "synthesizing",
      logs: [
        `Executed Python quantitative engine: computed Safety Index = ${safetyScore}/100.`,
        `Synthesized final verdict: "${verdict.toUpperCase()}"`,
        `Markdown investment report generated.`,
      ],
    };
  } catch (error: any) {
    return {
      verdict: "Neutral" as const,
      reasoningReport: `Failed to compile final report. Safety Index: ${safetyScore}/100.\n\n**Revenue/Growth:**\n${state.revenueGrowthAnalysis}\n\n**Risks:**\n${state.risksAnalysis}\n\n**Sentiment/Competitors:**\n${state.sentimentCompetitorsAnalysis}`,
      safetyScore,
      safetyBreakdown,
      currentStep: "synthesizing",
      logs: [`Report synthesis failed to parse JSON: ${error.message}. Outputting raw compilations.`],
    };
  }
}

// Construct the StateGraph workflow
const workflow = new StateGraph(ResearchState)
  .addNode("queryPlanner", queryPlannerNode)
  .addNode("searchExecutor", searchExecutorNode)
  .addNode("analyzer", analyzerNode)
  .addNode("validator", validatorNode)
  .addNode("reportGenerator", reportGeneratorNode);

// Define edges
workflow.addEdge("__start__", "queryPlanner");
workflow.addEdge("queryPlanner", "searchExecutor");
workflow.addEdge("searchExecutor", "analyzer");
workflow.addEdge("analyzer", "validator");

// Define conditional edges for the Check-Validate loop
workflow.addConditionalEdges(
  "validator",
  (state) => {
    if (state.verificationPassed || state.retryCount >= 2) {
      return "reportGenerator";
    }
    return "searchExecutor";
  },
  {
    reportGenerator: "reportGenerator",
    searchExecutor: "searchExecutor",
  }
);

workflow.addEdge("reportGenerator", "__end__");

// Compile the agent graph
export const agent = workflow.compile();
