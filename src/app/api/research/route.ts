import { NextRequest } from "next/server";
import { agent } from "@/lib/agent";
import { prisma } from "@/lib/db";
import { getChatModel } from "@/lib/tools";

export const runtime = "nodejs";

// GET past reports from database
export async function GET() {
  try {
    const reports = await prisma.researchReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return new Response(JSON.stringify(reports), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Failed to fetch reports:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 550,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST run research agent loop
export async function POST(req: NextRequest) {
  try {
    const {
      ticker,
      companyName,
      modelProvider,
      strategyHorizon,
      strategyRisk,
      revenueWeight,
      riskWeight,
      sentimentWeight,
    } = await req.json();

    let resolvedTicker = ticker || "";
    if (!resolvedTicker && companyName) {
      try {
        const model = getChatModel(modelProvider);
        const prompt = `Find the standard uppercase stock exchange ticker symbol for the company "${companyName}". Return ONLY the uppercase ticker symbol (e.g. "TSLA" or "AAPL" or "RELIANCE"). Do not include any punctuation, quotes, or explanatory text.`;
        const response = await model.invoke(prompt);
        resolvedTicker = (response.content as string).trim().replace(/['"‘“`]/g, "").toUpperCase();
        console.log(`[api/research] Dynamically resolved ticker "${resolvedTicker}" for company "${companyName}"`);
      } catch (err) {
        console.error("[api/research] Failed to resolve ticker dynamically:", err);
        resolvedTicker = companyName.split(" ")[0].toUpperCase();
      }
    }

    if (!resolvedTicker) {
      return new Response(JSON.stringify({ error: "Either Ticker symbol or Company Name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check for required API keys
    if (!process.env.TAVILY_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "TAVILY_API_KEY is not configured in `.env.local`. Please configure it to enable web research.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "No LLM API Key (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY) is configured in `.env.local`. Please provide one to enable LLM reasoning.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. Send an immediate initial chunk to establish the connection and display start status in UI
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                currentStep: "initiating",
                logs: ["Launching InsideAlpha Investment Agent...", "Awaiting LangGraph State Machine initialization..."],
                queries: [],
                verdict: null,
                safetyScore: 0,
                safetyBreakdown: "{}",
                reasoningReport: "",
                revenueGrowthAnalysis: "",
                risksAnalysis: "",
                sentimentCompetitorsAnalysis: "",
                retryCount: 0,
                verificationLog: [],
                verificationPassed: false,
              })}\n\n`
            )
          );

          // 2. Start the LangGraph execution stream
          const agentStream = await agent.stream(
            {
              ticker: resolvedTicker.toUpperCase().trim(),
              companyName: companyName ? companyName.trim() : "",
              modelProvider: modelProvider || "gemini",
              strategyHorizon: strategyHorizon || "Medium-Term",
              strategyRisk: strategyRisk || "Balanced",
              revenueWeight: Number(revenueWeight) || 33.3,
              riskWeight: Number(riskWeight) || 33.3,
              sentimentWeight: Number(sentimentWeight) || 33.4,
            },
            {
              streamMode: "values",
            }
          );

          let finalChunk: any = null;

          for await (const chunk of agentStream) {
            finalChunk = chunk;
            const data = {
              currentStep: chunk.currentStep,
              logs: chunk.logs || [],
              queries: chunk.queries || [],
              verdict: chunk.verdict,
              safetyScore: chunk.safetyScore || 0,
              safetyBreakdown: chunk.safetyBreakdown || "{}",
              reasoningReport: chunk.reasoningReport,
              revenueGrowthAnalysis: chunk.revenueGrowthAnalysis,
              risksAnalysis: chunk.risksAnalysis,
              sentimentCompetitorsAnalysis: chunk.sentimentCompetitorsAnalysis,
              retryCount: chunk.retryCount || 0,
              verificationLog: chunk.verificationLog || [],
              verificationPassed: chunk.verificationPassed || false,
            };

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          }

          // 3. Persist successfully completed reports to the database
          if (finalChunk && finalChunk.verdict && finalChunk.currentStep === "synthesizing") {
            try {
              await prisma.researchReport.create({
                data: {
                  ticker: resolvedTicker.toUpperCase().trim(),
                  companyName: finalChunk.companyName || companyName || resolvedTicker.toUpperCase().trim(),
                  verdict: finalChunk.verdict,
                  safetyScore: finalChunk.safetyScore || 0,
                  reasoningReport: finalChunk.reasoningReport || "",
                  revenueAnalysis: finalChunk.revenueGrowthAnalysis || "",
                  risksAnalysis: finalChunk.risksAnalysis || "",
                  sentimentAnalysis: finalChunk.sentimentCompetitorsAnalysis || "",
                  strategyHorizon: strategyHorizon || "Medium-Term",
                  strategyRisk: strategyRisk || "Balanced",
                },
              });
            } catch (dbErr) {
              console.error("Database save failed:", dbErr);
            }
          }

          controller.close();
        } catch (err: any) {
          console.error("Agent Streaming Error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: err.message || "An unexpected error occurred during research loop",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
