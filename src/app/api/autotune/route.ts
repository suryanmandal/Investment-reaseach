import { NextRequest, NextResponse } from "next/server";
import { getChatModel } from "@/lib/tools";

export async function POST(req: NextRequest) {
  try {
    const { companyInput, modelProvider } = await req.json();

    if (!companyInput) {
      return NextResponse.json({ error: "Company input is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "No LLM API keys are configured in your `.env.local` file." },
        { status: 500 }
      );
    }

    const model = getChatModel(modelProvider);
    const prompt = `You are an expert financial strategist and quantitative analyst configuring an AI investment research agent. 
Your task is to evaluate the provided company and define the optimal research parameters based on its sector, market maturity, and current macroeconomic dynamics.

Target Company / Ticker: ${companyInput}

You must output your configuration as a strict JSON object with the following schema. Do not include markdown formatting, backticks, or any conversational text.
{
  "horizon": "Short" | "Long" | "Medium",
  "riskProfile": "Conservative" | "Balanced" | "Aggressive",
  "weights": {
    "revenueAndGrowth": <integer 0-100>,
    "secRiskAudit": <integer 0-100>,
    "competitorSentiment": <integer 0-100>
  },
  "rationale": "A one-sentence explanation of why these settings are optimal for this specific company"
}

Constraints:
1. The three values inside "weights" MUST sum exactly to 100.
2. Tailor the weights to the company's nature (e.g., A volatile tech startup requires high Competitor Sentiment and Revenue weight. A legacy bank or highly regulated utility requires high SEC Risk Audit weight).
3. Output ONLY valid JSON.`;

    const response = await model.invoke(prompt);
    const content = response.content as string;

    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Model failed to return structured parameters.");
    }

    const config = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Auto-tune API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze optimal parameters." },
      { status: 550 }
    );
  }
}
