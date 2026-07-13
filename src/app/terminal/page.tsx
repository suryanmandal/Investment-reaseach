"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  LineChart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  FileText,
  CheckCircle2,
  Activity,
  ShieldCheck,
  Layers,
  Sparkles,
  History,
  SlidersHorizontal,
  Menu,
  X,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Settings,
} from "lucide-react";

// Types matching the API SSE output
interface StreamData {
  currentStep: string;
  logs: string[];
  queries: string[];
  verdict: "Bullish" | "Bearish" | "Neutral" | null;
  safetyScore: number;
  safetyBreakdown: string;
  reasoningReport: string;
  revenueGrowthAnalysis: string;
  risksAnalysis: string;
  sentimentCompetitorsAnalysis: string;
  retryCount: number;
  verificationLog: string[];
  verificationPassed: boolean;
  error?: string;
}

interface PastReport {
  id: string;
  ticker: string;
  companyName: string;
  verdict: "Bullish" | "Bearish" | "Neutral";
  safetyScore: number;
  reasoningReport: string;
  revenueAnalysis: string;
  risksAnalysis: string;
  sentimentAnalysis: string;
  strategyHorizon: string;
  strategyRisk: string;
  createdAt: string;
}

function getCompanyLogo(ticker: string): string {
  if (!ticker) return "";
  const sym = ticker.toUpperCase().trim();
  if (sym.includes("AAPL") || sym === "APPLE") return "/logos/apple.png";
  if (sym.includes("MSFT") || sym === "MICROSOFT") return "/logos/microsoft.png";
  if (sym.includes("ZOMATO")) return "/logos/zomato.png";
  if (sym.includes("RELIANCE")) return "/logos/reliance.png";
  if (sym.includes("HDFC")) return "/logos/hdfc.png";
  if (sym.includes("NVDA") || sym === "NVIDIA") return "/logos/nvidia.png";
  
  const domains: Record<string, string> = {
    TSLA: "tesla.com",
    GOOG: "google.com",
    GOOGL: "google.com",
    AMZN: "amazon.com",
    META: "meta.com",
    NFLX: "netflix.com",
  };
  if (domains[sym]) return `https://logo.clearbit.com/${domains[sym]}`;
  return "";
}

const PRELOADED_COMPANIES = [
  { ticker: "AAPL", name: "Apple Inc.", logo: "/logos/apple.png", color: "text-[#14172b]" },
  { ticker: "NVDA", name: "NVIDIA Corp", logo: "/logos/nvidia.png", color: "text-[#16a34a]" },
  { ticker: "MSFT", name: "Microsoft Corp", logo: "/logos/microsoft.png", color: "text-[#2563eb]" },
  { ticker: "ZOMATO", name: "Zomato Ltd", logo: "/logos/zomato.png", color: "text-[#f0505a]" },
  { ticker: "RELIANCE", name: "Reliance Industries", logo: "/logos/reliance.png", color: "text-amber-600" },
  { ticker: "HDFC", name: "HDFC Bank Ltd", logo: "/logos/hdfc.png", color: "text-indigo-600" }
];

const MOCK_USERS = [
  {
    name: "Alex Miller",
    role: "Senior Portfolio Manager",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&auto=format&q=80",
    preferences: {
      horizon: "Long-Term",
      risk: "Balanced",
    }
  },
  {
    name: "Sarah Chen",
    role: "Venture Capital Partner",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&fit=crop&auto=format&q=80",
    preferences: {
      horizon: "Short-Term",
      risk: "Aggressive",
    }
  }
];

const RECOMMENDATIONS = [
  { ticker: "MSFT", name: "Microsoft Corp", reason: "Stable long-term SaaS & Azure AI infrastructure.", category: "Growth Compounder", risk: "Balanced" },
  { ticker: "NVDA", name: "NVIDIA Corp", reason: "Speculative hardware compute catalyst demand.", category: "Aggressive Expansion", risk: "Aggressive" },
  { ticker: "JNJ", name: "Johnson & Johnson", reason: "Dividend fortress with highly defensive cash flows.", category: "Defensive Value", risk: "Conservative" }
];

function TerminalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTicker = searchParams.get("ticker") || "";
  const initialCompanyName = searchParams.get("companyName") || "";

  const [ticker, setTicker] = useState(initialTicker);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock Auth & Navigation
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [user, setUser] = useState<any>({
    name: "Alex Miller",
    role: "Senior Portfolio Manager",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&auto=format&q=80",
    preferences: {
      horizon: "Long-Term",
      risk: "Balanced",
    }
  });

  const modelProvider = "gemini"; // Kept under backend system silently

  // Auto-Tune
  const [tuning, setTuning] = useState(false);
  const [autotuneRationale, setAutotuneRationale] = useState("");

  // Strategy Profiler weights
  const [strategyHorizon, setStrategyHorizon] = useState("Medium-Term");
  const [strategyRisk, setStrategyRisk] = useState("Balanced");
  const [revenueWeight, setRevenueWeight] = useState(33);
  const [riskWeight, setRiskWeight] = useState(33);
  const [sentimentWeight, setSentimentWeight] = useState(34);

  // Agent State (logs and planning steps tracked in state, but kept out of UI)
  const [currentStep, setCurrentStep] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [queries, setQueries] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<"Bullish" | "Bearish" | "Neutral" | null>(null);
  const [safetyScore, setSafetyScore] = useState(0);
  const [safetyBreakdown, setSafetyBreakdown] = useState<any>({});
  const [reasoningReport, setReasoningReport] = useState("");
  const [revenueGrowth, setRevenueGrowth] = useState("");
  const [risks, setRisks] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [verificationLog, setVerificationLog] = useState<string[]>([]);
  const [verificationPassed, setVerificationPassed] = useState(false);

  const [pastReports, setPastReports] = useState<PastReport[]>([]);

  // Fetch History from DB
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/research");
      if (res.ok) {
        const data = await res.json();
        setPastReports(data);
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };

  useEffect(() => {
    fetchHistory();
    const triggerSignIn = localStorage.getItem("insidealpha_trigger_signin");
    if (triggerSignIn === "true") {
      localStorage.removeItem("insidealpha_trigger_signin");
      setShowSignInModal(true);
    }
    const stored = localStorage.getItem("insidealpha_user") || localStorage.getItem("antigravity_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({
          name: parsed.name,
          role: parsed.role || "Quant Analyst",
          avatarUrl: parsed.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&auto=format&q=80",
          preferences: {
            horizon: strategyHorizon,
            risk: strategyRisk,
          }
        });
      } catch (e) {
        console.error("Failed to load user session:", e);
      }
    }
  }, []);

  // Handle incoming URL parameters auto-tuning on load
  useEffect(() => {
    if (initialTicker) {
      const triggerAutoTuneOnLoad = async () => {
        setTuning(true);
        setAutotuneRationale("");
        try {
          const res = await fetch("/api/autotune", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyInput: initialTicker, modelProvider }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.horizon) {
              const hz = data.horizon === "Short" ? "Short-Term" : data.horizon === "Long" ? "Long-Term" : "Medium-Term";
              setStrategyHorizon(hz);
            }
            if (data.riskProfile) setStrategyRisk(data.riskProfile);
            if (data.weights) {
              setRevenueWeight(data.weights.revenueAndGrowth || 33);
              setRiskWeight(data.weights.secRiskAudit || 33);
              setSentimentWeight(data.weights.competitorSentiment || 34);
            }
            if (data.rationale) setAutotuneRationale(data.rationale);

            // Auto-trigger research loop after parameter tuning completes
            await runResearchAgent({
              targetTicker: initialTicker,
              targetName: initialCompanyName,
              horizon: data.horizon === "Short" ? "Short-Term" : data.horizon === "Long" ? "Long-Term" : "Medium-Term",
              risk: data.riskProfile,
              rev: data.weights?.revenueAndGrowth || 33,
              rsk: data.weights?.secRiskAudit || 33,
              snt: data.weights?.competitorSentiment || 34
            });
          }
        } catch (e) {
          console.error("AutoTune on load failed:", e);
        } finally {
          setTuning(false);
        }
      };
      triggerAutoTuneOnLoad();
    }
  }, [initialTicker]);

  // Adjust proportional weights
  const handleWeightChange = (type: "revenue" | "risk" | "sentiment", value: number) => {
    const remaining = 100 - value;
    if (type === "revenue") {
      const totalOther = riskWeight + sentimentWeight;
      if (totalOther === 0) {
        setRiskWeight(Math.round(remaining / 2));
        setSentimentWeight(Math.round(remaining / 2));
      } else {
        setRiskWeight(Math.round((riskWeight / totalOther) * remaining));
        setSentimentWeight(100 - value - Math.round((riskWeight / totalOther) * remaining));
      }
      setRevenueWeight(value);
    } else if (type === "risk") {
      const totalOther = revenueWeight + sentimentWeight;
      if (totalOther === 0) {
        setRevenueWeight(Math.round(remaining / 2));
        setSentimentWeight(Math.round(remaining / 2));
      } else {
        setRevenueWeight(Math.round((revenueWeight / totalOther) * remaining));
        setSentimentWeight(100 - value - Math.round((revenueWeight / totalOther) * remaining));
      }
      setRiskWeight(value);
    } else {
      const totalOther = revenueWeight + riskWeight;
      if (totalOther === 0) {
        setRevenueWeight(Math.round(remaining / 2));
        setRiskWeight(Math.round(remaining / 2));
      } else {
        setRevenueWeight(Math.round((revenueWeight / totalOther) * remaining));
        setRiskWeight(100 - value - Math.round((revenueWeight / totalOther) * remaining));
      }
      setSentimentWeight(value);
    }
  };

  const handleAutoTune = async () => {
    if (!ticker && !companyName) {
      setError("Please enter a Ticker Symbol or Company Name first to Auto-Tune the strategy.");
      return;
    }
    const target = ticker || companyName;
    setTuning(true);
    setError(null);
    setAutotuneRationale("");
    
    try {
      const res = await fetch("/api/autotune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyInput: target, modelProvider }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Auto-tune failed");
      }
      const data = await res.json();
      
      if (data.horizon) {
        if (data.horizon === "Short") setStrategyHorizon("Short-Term");
        else if (data.horizon === "Long") setStrategyHorizon("Long-Term");
        else setStrategyHorizon("Medium-Term");
      }
      if (data.riskProfile) setStrategyRisk(data.riskProfile);
      if (data.weights) {
        setRevenueWeight(data.weights.revenueAndGrowth || 33);
        setRiskWeight(data.weights.secRiskAudit || 33);
        setSentimentWeight(data.weights.competitorSentiment || 34);
      }
      if (data.rationale) setAutotuneRationale(data.rationale);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to auto-tune parameters.");
    } finally {
      setTuning(false);
    }
  };

  const runResearchAgent = async ({ targetTicker, targetName, horizon, risk, rev, rsk, snt }: any) => {
    setLoading(true);
    setError(null);
    setCurrentStep("initiating");
    setVerdict(null);
    setSafetyScore(0);
    setSafetyBreakdown({});
    setReasoningReport("");
    setRevenueGrowth("");
    setRisks("");
    setSentiment("");
    setVerificationPassed(false);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker: targetTicker.toUpperCase(),
          companyName: targetName,
          modelProvider,
          strategyHorizon: horizon,
          strategyRisk: risk,
          revenueWeight: rev,
          riskWeight: rsk,
          sentimentWeight: snt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initiate research agent");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Failed to read server response stream");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.substring(6);
            try {
              const data = JSON.parse(jsonStr) as StreamData;

              if (data.error) {
                setError(data.error);
                setLoading(false);
                return;
              }

              if (data.currentStep) setCurrentStep(data.currentStep);
              if (data.retryCount !== undefined) setRetryCount(data.retryCount);
              if (data.verificationPassed !== undefined) setVerificationPassed(data.verificationPassed);

              if (data.revenueGrowthAnalysis) setRevenueGrowth(data.revenueGrowthAnalysis);
              if (data.risksAnalysis) setRisks(data.risksAnalysis);
              if (data.sentimentCompetitorsAnalysis) setSentiment(data.sentimentCompetitorsAnalysis);
              if (data.verdict) setVerdict(data.verdict);
              if (data.safetyScore) setSafetyScore(data.safetyScore);
              if (data.safetyBreakdown) {
                try {
                  setSafetyBreakdown(JSON.parse(data.safetyBreakdown));
                } catch {
                  setSafetyBreakdown({});
                }
              }
              if (data.reasoningReport) setReasoningReport(data.reasoningReport);
            } catch (err) {
              console.error("Failed to parse SSE data block", err);
            }
          }
        }
      }

      // Refresh DB history list when a run completes
      fetchHistory();
    } catch (err: any) {
      console.error("Research error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker && !companyName) return;
    runResearchAgent({
      targetTicker: ticker,
      targetName: companyName,
      horizon: strategyHorizon,
      risk: strategyRisk,
      rev: revenueWeight,
      rsk: riskWeight,
      snt: sentimentWeight
    });
  };

  const handleSelectRecommendation = async (rec: any) => {
    setTicker(rec.ticker);
    setCompanyName(rec.name);
    setStrategyRisk(rec.risk);
    const hz = rec.risk === "Conservative" ? "Long-Term" : rec.risk === "Aggressive" ? "Short-Term" : "Medium-Term";
    setStrategyHorizon(hz);
    
    setTuning(true);
    setAutotuneRationale("");
    try {
      const res = await fetch("/api/autotune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyInput: rec.ticker, modelProvider }),
      });
      if (res.ok) {
        const data = await res.json();
        const finalRev = data.weights?.revenueAndGrowth || 33;
        const finalRsk = data.weights?.secRiskAudit || 33;
        const finalSnt = data.weights?.competitorSentiment || 34;
        
        setRevenueWeight(finalRev);
        setRiskWeight(finalRsk);
        setSentimentWeight(finalSnt);
        if (data.rationale) setAutotuneRationale(data.rationale);

        await runResearchAgent({
          targetTicker: rec.ticker,
          targetName: rec.name,
          horizon: hz,
          risk: rec.risk,
          rev: finalRev,
          rsk: finalRsk,
          snt: finalSnt
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTuning(false);
      setDrawerOpen(false);
    }
  };

  const handlePreloadedClick = async (sym: string, name: string) => {
    setTicker(sym);
    setCompanyName(name);
    setTuning(true);
    setAutotuneRationale("");
    
    try {
      const res = await fetch("/api/autotune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyInput: sym, modelProvider }),
      });
      
      let finalHorizon = strategyHorizon;
      let finalRisk = strategyRisk;
      let finalRev = revenueWeight;
      let finalRsk = riskWeight;
      let finalSnt = sentimentWeight;

      if (res.ok) {
        const data = await res.json();
        if (data.horizon) {
          const hz = data.horizon === "Short" ? "Short-Term" : data.horizon === "Long" ? "Long-Term" : "Medium-Term";
          setStrategyHorizon(hz);
          finalHorizon = hz;
        }
        if (data.riskProfile) {
          setStrategyRisk(data.riskProfile);
          finalRisk = data.riskProfile;
        }
        if (data.weights) {
          setRevenueWeight(data.weights.revenueAndGrowth || 33);
          setRiskWeight(data.weights.secRiskAudit || 33);
          setSentimentWeight(data.weights.competitorSentiment || 34);
          finalRev = data.weights.revenueAndGrowth || 33;
          finalRsk = data.weights.secRiskAudit || 33;
          finalSnt = data.weights.competitorSentiment || 34;
        }
        if (data.rationale) setAutotuneRationale(data.rationale);
      }

      await runResearchAgent({
        targetTicker: sym,
        targetName: name,
        horizon: finalHorizon,
        risk: finalRisk,
        rev: finalRev,
        rsk: finalRsk,
        snt: finalSnt
      });
    } catch (err) {
      console.error(err);
    } finally {
      setTuning(false);
    }
  };

  const loadPastReport = (report: PastReport) => {
    setTicker(report.ticker);
    setCompanyName(report.companyName);
    setVerdict(report.verdict);
    setSafetyScore(report.safetyScore);
    setReasoningReport(report.reasoningReport);
    setRevenueGrowth(report.revenueAnalysis);
    setRisks(report.risksAnalysis);
    setSentiment(report.sentimentAnalysis);
    setStrategyHorizon(report.strategyHorizon);
    setStrategyRisk(report.strategyRisk);
    setVerificationPassed(true);
    setRetryCount(0);
    setCurrentStep("synthesizing");
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");

    const formatBoldText = (str: string) => {
      let formatted = str.replace(/\*\*(.*?)\*\//g, '<strong class="text-[#14172b] font-bold">$1</strong>');
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#14172b] font-bold">$1</strong>');
      formatted = formatted.replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 text-[#2563eb] px-1 py-0.5 rounded font-mono text-xs font-semibold">$1</code>'
      );
      return formatted;
    };

    return (
      <div className="prose-report text-[#565b74] text-xs sm:text-sm leading-relaxed space-y-4">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("# ")) {
            return (
              <h2
                key={idx}
                className="text-lg font-black text-[#14172b] tracking-tight border-b border-[#e3e5ed] pb-1.5 mt-5 font-display"
                dangerouslySetInnerHTML={{ __html: formatBoldText(trimmed.substring(2)) }}
              />
            );
          }
          if (trimmed.startsWith("## ")) {
            return (
              <h3
                key={idx}
                className="text-sm sm:text-base font-extrabold text-[#14172b] tracking-tight mt-4 font-display"
                dangerouslySetInnerHTML={{ __html: formatBoldText(trimmed.substring(3)) }}
              />
            );
          }
          if (trimmed.startsWith("### ")) {
            return (
              <h4
                key={idx}
                className="text-xs sm:text-sm font-bold text-[#14172b] tracking-tight mt-3 font-display"
                dangerouslySetInnerHTML={{ __html: formatBoldText(trimmed.substring(4)) }}
              />
            );
          }
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <ul key={idx} className="list-disc pl-5 text-xs sm:text-sm my-1 space-y-1">
                <li dangerouslySetInnerHTML={{ __html: formatBoldText(trimmed.substring(2)) }} />
              </ul>
            );
          }
          if (trimmed.startsWith("> ")) {
            return (
              <blockquote
                key={idx}
                className="border-l-3 border-[#2563eb] pl-4 py-1 italic text-slate-600 bg-slate-50 rounded-r-lg my-3"
                dangerouslySetInnerHTML={{ __html: formatBoldText(trimmed.substring(2)) }}
              />
            );
          }
          if (!trimmed) return <div key={idx} className="h-1.5" />;
          return (
            <p
              key={idx}
              className="text-xs sm:text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatBoldText(line) }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <main className="min-h-screen py-8 px-4 md:px-10 lg:px-12 w-full max-w-full flex flex-col justify-between animate-fade-in relative z-10 text-[#14172b]">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#e3e5ed] pb-5 mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-slate-100 border border-[#e3e5ed] rounded-xl text-[#565b74] hover:text-[#14172b] transition-all cursor-pointer shadow-sm bg-white"
            title="Back to Landing Page"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl shadow-sm">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-black tracking-tight text-[#14172b] font-display">
              InsideAlpha
            </h1>
            <p className="text-[10px] text-[#565b74] font-semibold uppercase tracking-wider">
              Research Terminal Dashboard
            </p>
          </div>
        </div>

        {/* Global Connection Badges & Profile Menu */}
        <div className="flex items-center justify-between md:justify-end space-x-4">
          <a
            href="https://github.com/suryanmandal/Investment-reaseach"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-xs text-[#565b74] hover:text-[#2563eb] transition-colors border border-[#e3e5ed] px-3.5 py-2 bg-white rounded-xl shadow-sm cursor-pointer"
          >
            GitHub
          </a>

          <div className="flex items-center space-x-2.5">
            {user ? (
              <div className="hidden sm:flex flex-col text-right text-[10px]">
                <span className="font-bold text-[#14172b]">{user.name}</span>
              </div>
            ) : (
              <button
                onClick={() => setShowSignInModal(true)}
                className="hidden sm:inline-block text-[10px] font-bold text-[#2563eb] hover:text-[#3b82f6] transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}

            {user && (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover border border-[#e3e5ed] cursor-pointer hover:border-[#2563eb] transition-colors"
                onClick={() => setDrawerOpen(true)}
              />
            )}

            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 hover:bg-slate-100 border border-[#e3e5ed] rounded-xl text-[#565b74] hover:text-[#14172b] transition-all cursor-pointer bg-white"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Preloaded Company Information strip */}
      <section className="mb-6">
        <div className="text-[10px] font-bold text-[#676c85] uppercase tracking-wider mb-2.5">
          Select Target Market Leader to Run Research Loop
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRELOADED_COMPANIES.map((company) => (
            <button
              key={company.ticker}
              onClick={() => handlePreloadedClick(company.ticker, company.name)}
              className="bg-white border border-[#e3e5ed] hover:border-[#d3d7e2] rounded-xl p-3.5 flex items-center justify-between transition-all hover:-translate-y-0.5 cursor-pointer shadow-sm text-left group"
            >
              <div className="flex items-center space-x-2.5">
                <img
                  src={company.logo}
                  alt={company.ticker}
                  className="h-6 w-6 object-contain rounded-md shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <div className="font-extrabold text-xs text-[#14172b] uppercase tracking-wider">{company.ticker}</div>
                  <div className="text-[9px] text-[#565b74] font-medium truncate max-w-[80px]">{company.name}</div>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#2563eb] transition-colors" />
            </button>
          ))}
        </div>
      </section>

      {/* Main Grid: Left Side strategy profiler / Right side Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Strategy Profiler (FILTERING PANEL) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-[#e3e5ed] rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="border-b border-[#e3e5ed] pb-3.5 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#14172b] tracking-wider uppercase flex items-center space-x-2">
                <SlidersHorizontal className="h-4.5 w-4.5 text-[#2563eb]" />
                <span>Strategy Profiler</span>
              </h2>
            </div>

            <form onSubmit={handleLaunchAgent} className="space-y-5">
              {/* Company Name Search (Inside filter) */}
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="companyName" className="text-xs font-bold text-[#14172b] uppercase tracking-wider">
                  Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  placeholder="e.g. Tesla, Reliance Industries"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f7f8fa] border border-[#e3e5ed] rounded-xl text-sm font-bold text-[#14172b] placeholder-[#676c85] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              {/* Ticker Search (Inside filter) */}
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="ticker" className="text-xs font-bold text-[#14172b] uppercase tracking-wider">
                  Ticker Symbol
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input
                    id="ticker"
                    type="text"
                    placeholder="e.g. TSLA, AAPL"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f7f8fa] border border-[#e3e5ed] rounded-xl text-sm font-extrabold text-[#14172b] placeholder-[#676c85] focus:outline-none focus:border-[#2563eb] uppercase tracking-wider"
                  />
                </div>
              </div>

              {/* Strategy Horizon (Enlarged) */}
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-bold text-[#14172b] uppercase tracking-wider">Horizon</label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#f7f8fa] p-1 border border-[#e3e5ed] rounded-xl">
                  {["Short-Term", "Medium-Term", "Long-Term"].map((hz) => (
                    <button
                      key={hz}
                      type="button"
                      onClick={() => setStrategyHorizon(hz)}
                      className={`py-2 text-[10px] sm:text-xs font-black rounded-lg cursor-pointer transition-all uppercase ${
                        strategyHorizon === hz
                          ? "bg-[#2563eb] text-white shadow-sm font-extrabold"
                          : "text-[#565b74] hover:text-[#14172b]"
                      }`}
                    >
                      {hz.split("-")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Risk Profile Option (Enlarged) */}
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-bold text-[#14172b] uppercase tracking-wider">Risk Profile</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {["Conservative", "Balanced", "Aggressive"].map((rk) => (
                    <button
                      key={rk}
                      type="button"
                      onClick={() => setStrategyRisk(rk)}
                      className={`py-3 px-4 text-xs sm:text-sm font-extrabold rounded-xl border transition-all cursor-pointer uppercase ${
                        strategyRisk === rk
                          ? "bg-[#2563eb] text-white border-[#2563eb] shadow-sm shadow-[#2563eb]/10"
                          : "bg-white border-[#e3e5ed] text-[#565b74] hover:text-[#14172b] hover:border-[#d3d7e2]"
                      }`}
                    >
                      {rk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight Adjustment Sliders (Enlarged) */}
              <div className="space-y-4 pt-1">
                <label className="text-xs font-bold text-[#14172b] uppercase tracking-wider flex justify-between">
                  <span>Pillar Weights</span>
                  <span className="text-[#2563eb] font-mono">100%</span>
                </label>

                {/* Slider 1: Revenue Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#565b74] font-bold">
                    <span>Revenue & Growth</span>
                    <span className="font-mono text-[#2563eb]">{revenueWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={revenueWeight}
                    onChange={(e) => handleWeightChange("revenue", Number(e.target.value))}
                    className="w-full h-1.5 bg-[#eef0f4] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
                  />
                </div>

                {/* Slider 2: Risk Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#565b74] font-bold">
                    <span>SEC Risk Audit</span>
                    <span className="font-mono text-[#2563eb]">{riskWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={riskWeight}
                    onChange={(e) => handleWeightChange("risk", Number(e.target.value))}
                    className="w-full h-1.5 bg-[#eef0f4] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
                  />
                </div>

                {/* Slider 3: Sentiment Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#565b74] font-bold">
                    <span>Competitor Sentiment</span>
                    <span className="font-mono text-[#2563eb]">{sentimentWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={sentimentWeight}
                    onChange={(e) => handleWeightChange("sentiment", Number(e.target.value))}
                    className="w-full h-1.5 bg-[#eef0f4] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
                  />
                </div>
              </div>

              {/* Action Buttons: Auto-tune sits just above Search */}
              <div className="pt-4 space-y-2 border-t border-[#e3e5ed]">
                {/* Auto Tune Action Button */}
                <button
                  type="button"
                  onClick={handleAutoTune}
                  disabled={tuning || loading}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 border border-[#e3e5ed] text-[#2563eb] font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  {tuning ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Auto-Tuning Setup...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-[#2563eb]" />
                      <span>AI Auto-Tune Weights</span>
                    </>
                  )}
                </button>

                {/* Eye-catching Search Button */}
                <button
                  type="submit"
                  disabled={loading || (!ticker && !companyName)}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-[#2563eb] hover:from-blue-500 hover:to-blue-600 text-white font-extrabold rounded-xl text-xs uppercase tracking-widest transition-all shadow-md active:scale-97 cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-60 disabled:cursor-not-allowed border border-white/10"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Running Analysis...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 text-white" />
                      <span>Initiate Research Loop</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-250 text-[#f0505a] text-xs font-semibold rounded-xl leading-relaxed text-center">
                {error}
              </div>
            )}
          </div>

          {/* Past Audits Sidebar */}
          <div className="bg-white border border-[#e3e5ed] rounded-2xl p-5 shadow-sm flex flex-col max-h-[300px]">
            <h2 className="text-xs font-extrabold text-[#14172b] tracking-wider uppercase mb-3 flex items-center space-x-2 border-b border-[#e3e5ed] pb-2">
              <History className="h-4 w-4 text-[#2563eb]" />
              <span>Recent Audits ({pastReports.length})</span>
            </h2>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1.5">
              {pastReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => loadPastReport(report)}
                  className="w-full text-left p-2.5 hover:bg-slate-50 border border-transparent hover:border-[#e3e5ed] rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-[#14172b] uppercase">{report.ticker}</div>
                    <div className="text-[10px] text-[#565b74] truncate max-w-[120px] font-medium">{report.companyName}</div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full font-black uppercase text-[8px] border ${
                        report.verdict === "Bullish"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : report.verdict === "Bearish"
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-amber-50 border-amber-200 text-amber-600"
                      }`}
                    >
                      {report.verdict}
                    </span>
                    <div className="text-[#676c85] font-mono text-[9px] mt-0.5">{report.safetyScore}/100</div>
                  </div>
                </button>
              ))}
              {pastReports.length === 0 && (
                <div className="text-[11px] text-[#676c85] text-center py-6">No audits saved in SQLite.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Bento Grid Dashboard Output */}
        <div className="lg:col-span-3 space-y-6">
          
          {verdict ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Bento Card 1: Executive Summary & Recommendation Verdict */}
              <div className="md:col-span-2 bg-white border border-[#e3e5ed] rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[220px]">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#676c85] uppercase tracking-wider">
                    Investment Recommendation
                  </span>
                  <h2 className="text-2xl font-black text-[#14172b] uppercase tracking-tight flex items-center space-x-2.5">
                    {getCompanyLogo(ticker) ? (
                      <img
                        src={getCompanyLogo(ticker)}
                        alt={ticker}
                        className="h-7 w-7 object-contain rounded-md border border-[#e3e5ed] p-0.5 bg-white shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-md bg-[#2563eb] text-white flex items-center justify-center text-xs font-black shrink-0 font-mono">
                        {ticker ? ticker.charAt(0).toUpperCase() : "S"}
                      </div>
                    )}
                    <span>{ticker.toUpperCase()}</span>
                    <span className="text-slate-300">·</span>
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-black uppercase border ${
                        verdict === "Bullish"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : verdict === "Bearish"
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-amber-50 border-amber-200 text-amber-600"
                      }`}
                    >
                      {verdict}
                    </span>
                  </h2>
                </div>

                {/* Sub details */}
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#e3e5ed] pt-3.5 text-xs text-[#565b74]">
                  <div>
                    <span className="text-[#676c85] block uppercase font-bold text-[9px] tracking-wider">Horizon</span>
                    <span className="font-extrabold text-[#14172b] text-[13px]">{strategyHorizon}</span>
                  </div>
                  <div>
                    <span className="text-[#676c85] block uppercase font-bold text-[9px] tracking-wider">Risk Profile</span>
                    <span className="font-extrabold text-[#14172b] text-[13px]">{strategyRisk}</span>
                  </div>
                  <div>
                    <span className="text-[#676c85] block uppercase font-bold text-[9px] tracking-wider">Check-Validate Loop</span>
                    <span className="font-extrabold text-[#14172b] text-[13px]">
                      {retryCount > 0 ? `Retried (${retryCount}x)` : "Clean Audit Pass"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bento Card 2: Professional Strategy Weights Pie Chart */}
              <div className="bg-white border border-[#e3e5ed] rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-sm">
                <span className="text-[10px] font-mono font-bold text-[#676c85] uppercase tracking-wider mb-2.5 block">
                  Strategy Weights Distribution
                </span>

                {/* Dynamic SVG Pie Chart representing Slider Weights */}
                <div className="relative h-28 w-28 flex items-center justify-center">
                  <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                    {/* Segment 1: Revenue Weight (Blue) */}
                    <circle
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="transparent"
                      stroke="#2563eb"
                      strokeWidth="5"
                      strokeDasharray={`${revenueWeight} ${100 - revenueWeight}`}
                      strokeDashoffset="0"
                    />
                    {/* Segment 2: Risk Weight (Rose) */}
                    <circle
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="transparent"
                      stroke="#f0505a"
                      strokeWidth="5"
                      strokeDasharray={`${riskWeight} ${100 - riskWeight}`}
                      strokeDashoffset={-revenueWeight}
                    />
                    {/* Segment 3: Sentiment Weight (Green) */}
                    <circle
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="transparent"
                      stroke="#16a34a"
                      strokeWidth="5"
                      strokeDasharray={`${sentimentWeight} ${100 - sentimentWeight}`}
                      strokeDashoffset={-(revenueWeight + riskWeight)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-black text-[#14172b] font-mono">100%</span>
                    <span className="text-[8px] text-[#676c85] uppercase font-bold">Allocated</span>
                  </div>
                </div>

                {/* Legend Table */}
                <div className="grid grid-cols-3 gap-2 w-full mt-2 text-[8px] border-t border-[#e3e5ed] pt-2 font-semibold">
                  <div>
                    <span className="text-[#2563eb] block uppercase">Growth</span>
                    <span className="font-bold text-[#14172b] font-mono">{revenueWeight}%</span>
                  </div>
                  <div>
                    <span className="text-[#f0505a] block uppercase">SEC Risk</span>
                    <span className="font-bold text-[#14172b] font-mono">{riskWeight}%</span>
                  </div>
                  <div>
                    <span className="text-[#16a34a] block uppercase">Sentiment</span>
                    <span className="font-bold text-[#14172b] font-mono">{sentimentWeight}%</span>
                  </div>
                </div>
              </div>

              {/* Bento Card 3: Quantitative Safety Index Gauge */}
              <div className="bg-white border border-[#e3e5ed] rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-sm min-h-[220px]">
                <span className="text-[10px] font-mono font-bold text-[#676c85] uppercase tracking-wider mb-2">
                  InsideAlpha Safety Index
                </span>
                
                {/* SVG Radial Progress Gauge */}
                <div className="relative h-24 w-24">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        safetyScore > 75
                          ? "text-[#16a34a]"
                          : safetyScore > 50
                          ? "text-amber-500"
                          : "text-[#f0505a]"
                      }
                      strokeWidth="2.5"
                      strokeDasharray={`${safetyScore}, 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-[#14172b] font-mono">{safetyScore}</span>
                    <span className="text-[8px] text-[#676c85] uppercase font-bold">Score</span>
                  </div>
                </div>

                {safetyBreakdown && safetyBreakdown.revenueScore !== undefined && (
                  <div className="grid grid-cols-3 gap-1.5 w-full mt-2 text-[8px] border-t border-[#e3e5ed] pt-2 font-semibold">
                    <div>
                      <span className="text-slate-500 block uppercase">Growth</span>
                      <span className="text-[#14172b] font-mono">{safetyBreakdown.revenueScore}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase">SEC Risk</span>
                      <span className="text-[#14172b] font-mono">{safetyBreakdown.riskScore}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase">Sentiment</span>
                      <span className="text-[#14172b] font-mono">{safetyBreakdown.sentimentScore}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bento Card 4: Quantitative Core (Revenue & Growth Analysis) */}
              <div className="bg-white border border-[#e3e5ed] rounded-2xl p-6 shadow-sm md:col-span-2">
                <h3 className="text-xs font-mono font-bold text-[#676c85] uppercase tracking-wider border-b border-[#e3e5ed] pb-2.5 mb-4 flex items-center space-x-2">
                  <LineChart className="h-4 w-4 text-[#2563eb]" />
                  <span>Pillar 1: Quantitative Core & Margins</span>
                </h3>
                {revenueGrowth ? (
                  renderMarkdown(revenueGrowth)
                ) : (
                  <div className="text-xs text-slate-400 py-8 text-center font-medium animate-pulse">Running quantitative checks...</div>
                )}
              </div>

              {/* Bento Card 5: SEC Risk Audit Filings Scan */}
              <div className="bg-white border border-[#e3e5ed] rounded-2xl p-6 shadow-sm md:col-span-3">
                <h3 className="text-xs font-mono font-bold text-[#676c85] uppercase tracking-wider border-b border-[#e3e5ed] pb-2.5 mb-4 flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-[#f0505a]" />
                  <span>Pillar 2: SEC Risk Audit (Debt, Litigation, Disclosures)</span>
                </h3>
                {risks ? (
                  renderMarkdown(risks)
                ) : (
                  <div className="text-xs text-slate-400 py-8 text-center font-medium animate-pulse">Scanning SEC filings programmatically...</div>
                )}
              </div>

              {/* Bento Card 6: news & Competitor Sentiment Synthesis */}
              <div className="bg-white border border-[#e3e5ed] rounded-2xl p-6 shadow-sm md:col-span-3">
                <h3 className="text-xs font-mono font-bold text-[#676c85] uppercase tracking-wider border-b border-[#e3e5ed] pb-2.5 mb-4 flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-[#16a34a]" />
                  <span>Pillar 3: Sentiment & Competitor Synthesis</span>
                </h3>
                {sentiment ? (
                  renderMarkdown(sentiment)
                ) : (
                  <div className="text-xs text-slate-400 py-8 text-center font-medium animate-pulse">Evaluating news velocity and competitors...</div>
                )}
              </div>

              {/* Bento Card 7: AI Verdict Reasoning & Report Narrative */}
              <div className="bg-white border border-[#e3e5ed] rounded-2xl p-6 shadow-sm md:col-span-3">
                <h3 className="text-xs font-mono font-bold text-[#676c85] uppercase tracking-wider border-b border-[#e3e5ed] pb-2.5 mb-4 flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-[#2563eb]" />
                  <span>Executive Thesis Report Narrative</span>
                </h3>
                {reasoningReport ? (
                  renderMarkdown(reasoningReport)
                ) : (
                  <div className="text-xs text-slate-400 py-8 text-center font-medium animate-pulse">Compiling final verified verdict brief...</div>
                )}
              </div>

            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Bento Welcome Header Card */}
              <div className="md:col-span-3 bg-white border border-[#e3e5ed] rounded-2xl p-7 shadow-sm text-left space-y-4">
                <div className="inline-flex p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[#2563eb] shadow-sm">
                  <Sparkles className="h-6 w-6 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-[#14172b] tracking-tight font-display">
                    Welcome to the Quantitative Research Node
                  </h2>
                  <p className="text-[#565b74] text-xs sm:text-sm leading-relaxed max-w-2xl font-medium">
                    To start, select one of the preloaded market leaders at the top of the screen to auto-trigger the research loop, or use the Strategy Profiler panel on the left to enter any custom stock ticker.
                  </p>
                </div>
              </div>

              {/* Bento Process Node Card 1 */}
              <div className="bg-white border border-[#e3e5ed] rounded-2xl p-6 shadow-sm space-y-3">
                <div className="p-2.5 bg-blue-50 border border-blue-100 text-[#2563eb] rounded-xl w-fit">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#14172b] font-display">1. Profile Tuning</h4>
                <p className="text-[#565b74] text-[11px] leading-relaxed font-medium">
                  The AI Strategist maps the company sector and auto-tunes optimal quantitative and risk filters.
                </p>
              </div>

              {/* Bento Process Node Card 2 */}
              <div className="bg-white border border-[#e3e5ed] rounded-2xl p-6 shadow-sm space-y-3">
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-[#16a34a] rounded-xl w-fit">
                  <Search className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#14172b] font-display">2. Multi-Pillar Research</h4>
                <p className="text-[#565b74] text-[11px] leading-relaxed font-medium">
                  Autonomous agents scan SEC filings, margins trajectories, and news sentiment concurrently.
                </p>
              </div>

              {/* Bento Process Node Card 3 */}
              <div className="bg-white border border-[#e3e5ed] rounded-2xl p-6 shadow-sm space-y-3">
                <div className="p-2.5 bg-rose-50 border border-rose-100 text-[#f0505a] rounded-xl w-fit">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#14172b] font-display">3. Fact verification</h4>
                <p className="text-[#565b74] text-[11px] leading-relaxed font-medium">
                  A cyclic fact-check validator cross-audits findings against SQLite database structures.
                </p>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Slide-out Strategist Hamburger Drawer Menu */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#14172b]/20 backdrop-blur-xs cursor-pointer"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer container */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col justify-between border-l border-[#e3e5ed] animate-slide-in">
            <div className="space-y-6">
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-[#e3e5ed] pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg">
                    <Layers className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-extrabold text-sm text-[#14172b]">Strategist Deck</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 hover:bg-slate-100 border border-[#e3e5ed] rounded-lg text-[#565b74] hover:text-[#14172b]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* User Profile Info */}
              <div className="bg-[#f7f8fa] border border-[#e3e5ed] rounded-xl p-4 space-y-3.5">
                <div className="flex items-center space-x-3">
                  <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover border border-[#2563eb]/20" />
                  <div>
                    <h4 className="font-bold text-xs text-[#14172b]">{user.name}</h4>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-[#e3e5ed] grid grid-cols-2 gap-2 text-[9px] text-[#565b74] uppercase font-bold">
                  <div>
                    <span className="block text-[8px] text-[#676c85]">Default Horizon</span>
                    <span className="text-[#14172b]">{user.preferences.horizon}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-[#676c85]">Default Risk</span>
                    <span className="text-[#14172b]">{user.preferences.risk}</span>
                  </div>
                </div>
              </div>

              {/* Curated Recommendations */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold text-[#676c85] uppercase tracking-wider">Curated AI Recommendations</h4>
                <div className="space-y-2">
                  {RECOMMENDATIONS.map((rec) => (
                    <div
                      key={rec.ticker}
                      onClick={() => handleSelectRecommendation(rec)}
                      className="group p-3 bg-white border border-[#e3e5ed] hover:border-[#2563eb]/30 rounded-xl cursor-pointer hover:shadow-sm transition-all text-left flex justify-between items-center"
                    >
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-black text-xs text-[#14172b]">{rec.ticker}</span>
                          <span className="text-[8px] px-1.5 py-0.5 bg-slate-50 border border-slate-100 text-[#565b74] rounded font-semibold uppercase">{rec.category}</span>
                        </div>
                        <p className="text-[9px] text-[#676c85] leading-normal mt-0.5">{rec.reason}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#2563eb] transition-colors shrink-0 ml-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#e3e5ed] pt-4 text-center">
              <p className="text-[9px] text-slate-400 font-mono">InsideAlpha v1.2.0 • Pro Suite</p>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14172b]/20 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-[#e3e5ed] p-6 space-y-4 shadow-2xl relative animate-float">
            <button
              onClick={() => setShowSignInModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-[#14172b] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-bold text-[#14172b]">Select Persona Profile</h3>
            <p className="text-[10px] text-[#565b74] leading-normal">Choose a professional quantitative strategist profile to customize recommendations and default priorities.</p>
            <div className="space-y-2 pt-2">
              {MOCK_USERS.map((u) => (
                <button
                  key={u.name}
                  onClick={() => {
                    setUser(u);
                    setStrategyHorizon(u.preferences.horizon);
                    setStrategyRisk(u.preferences.risk);
                    setShowSignInModal(false);
                    setLogs((prev) => [...prev, `[USER] Logged in as ${u.name} (${u.role})`]);
                  }}
                  className="w-full p-3 bg-[#f7f8fa] hover:bg-slate-50 border border-[#e3e5ed] hover:border-[#d3d7e2] rounded-xl flex items-center space-x-3 cursor-pointer text-left transition-all"
                >
                  <img src={u.avatarUrl} alt={u.name} className="h-8 w-8 rounded-full object-cover border border-[#2563eb]/20" />
                  <div>
                    <div className="text-xs font-bold text-[#14172b]">{u.name}</div>
                    <div className="text-[10px] text-[#565b74] font-medium">{u.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default function TerminalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center text-[#14172b] font-mono text-xs">Initializing Research Terminal...</div>}>
      <TerminalContent />
    </Suspense>
  );
}
