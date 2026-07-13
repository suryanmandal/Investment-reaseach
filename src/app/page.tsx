"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  ArrowRight,
  Cpu,
  FileText,
  MessageSquare,
} from "lucide-react";

const TICKERS = [
  { sym: "AAPL", chg: "+1.24%", up: true },
  { sym: "NVDA", chg: "+3.86%", up: true },
  { sym: "MSFT", chg: "-0.42%", up: false },
  { sym: "ZOMATO", chg: "+2.10%", up: true },
  { sym: "RELIANCE", chg: "-0.65%", up: false },
  { sym: "HDFC", chg: "+0.88%", up: true },
  { sym: "TSLA", chg: "-1.75%", up: false },
  { sym: "GOOGL", chg: "+0.53%", up: true }
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col justify-between relative overflow-hidden font-sans text-[#14172b]">
      
      {/* CSS Keyframe Animations & Template variables */}
      <style>{`
        @keyframes float-y-1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-float-y-1 { animation: float-y-1 6s ease-in-out infinite; }
        .animate-ticker-scroll { animation: ticker-scroll 32s linear infinite; }

        .hero-grid {
          background-image:
            linear-gradient(#e3e5ed 1px, transparent 1px),
            linear-gradient(90deg, #e3e5ed 1px, transparent 1px);
          background-size: 56px 56px;
          opacity: 0.35;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 20%, black, transparent 75%);
        }
      `}</style>

      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[40vh] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[30vh] bg-sky-400/8 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 w-full bg-[#f5f6f8]/85 backdrop-blur-md border-b border-[#d3d7e2] z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-gradient-to-br from-[#2563eb] to-[#38bdf8] rounded-lg shadow-sm">
              <Layers className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-[#14172b] font-display">
              InsideAlpha
            </span>
          </div>

          <div className="flex items-center space-x-3.5">
            <button
              onClick={() => router.push("/terminal")}
              className="font-semibold text-xs text-[#565b74] hover:text-[#14172b] px-3 py-1.5 transition-colors cursor-pointer"
            >
              Terminal
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="font-semibold text-xs text-white bg-[#2563eb] hover:bg-[#3b82f6] px-5 py-2.5 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm shadow-[#2563eb]/20"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-24 pb-16 overflow-hidden z-10 flex-1 flex flex-col justify-center">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="max-w-[760px] mx-auto text-center flex flex-col items-center gap-6">
            {/* Eyebrow badge */}
            <span className="text-[11px] font-mono tracking-widest text-[#2563eb] bg-[#2563eb]/8 border border-[#2563eb]/25 px-3.5 py-1.5 rounded-full uppercase font-semibold">
              Autonomous Equity Research
            </span>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-[3.2rem] font-extrabold tracking-tight leading-[1.15] text-[#14172b] font-display">
              Market-Defying <span className="text-[#2563eb]">Investment Intelligence</span> On Demand.
            </h1>

            {/* Subtitle */}
            <p className="text-[#565b74] text-sm sm:text-base max-w-[56ch] leading-relaxed">
              An autonomous financial agent that maps market architecture, filters macroeconomic volatility, and compiles institutional-grade equity research theses instantly.
            </p>

            {/* CTA Wrap */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                onClick={() => router.push("/terminal")}
                className="group px-8.5 py-4 bg-[#2563eb] hover:bg-[#3b82f6] text-white font-semibold rounded-xl text-sm tracking-wide transition-all shadow-[0_0_0_1px_rgba(37,99,235,0.4),0_12px_28px_rgba(37,99,235,0.22)] hover:shadow-[0_0_0_1px_rgba(37,99,235,0.55),0_16px_34px_rgba(37,99,235,0.3)] active:scale-97 cursor-pointer flex items-center space-x-2"
              >
                <span>Launch Research Terminal</span>
                <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className="text-[11px] text-[#676c85] font-mono tracking-wider">
                Secure Sandboxed Execution Space · No Authentication Required
              </p>
            </div>
          </div>
        </div>

        {/* Ticker Track Strip */}
        <div className="mt-16 border-y border-[#e3e5ed] bg-[#eef0f4] overflow-hidden relative w-full">
          <div className="ticker-track flex w-max animate-ticker-scroll py-3.5">
            {[...TICKERS, ...TICKERS].map((t, idx) => (
              <div key={idx} className="ticker-item flex items-center space-x-2 px-9 border-r border-[#e3e5ed] font-mono text-xs">
                <span className="font-semibold text-[#14172b] uppercase">{t.sym}</span>
                <span className={`font-semibold ${t.up ? "text-[#16a34a]" : "text-[#f0505a]"}`}>
                  {t.chg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PILLARS SECTION ================= */}
      <section className="py-22 border-t border-[#e3e5ed] relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-[56ch] text-left mb-12">
          <span className="text-[11px] font-mono tracking-widest text-[#2563eb] uppercase font-semibold block mb-3">Coverage Pillars</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14172b] tracking-tight font-display mb-3">Three agents, one thesis.</h2>
          <p className="text-[#565b74] text-sm leading-relaxed">
            Each research pass runs across three coordinated analysis pillars before a verdict is compiled.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Quantitative Core */}
          <div className="bg-white border border-[#e3e5ed] hover:border-[#d3d7e2] rounded-2xl p-7 space-y-3.5 hover:-translate-y-0.5 transition-all">
            <span className="text-[10.5px] font-mono text-[#676c85] tracking-wider uppercase block">01 · Financials</span>
            <h3 className="text-base font-bold text-[#14172b] font-display">Quantitative Core</h3>
            <p className="text-[#565b74] text-xs leading-relaxed">
              Monitors active revenue trajectories, operating income margins, and parses raw financial tables programmatically.
            </p>
          </div>

          {/* SEC Risk Audit */}
          <div className="bg-white border border-[#e3e5ed] hover:border-[#d3d7e2] rounded-2xl p-7 space-y-3.5 hover:-translate-y-0.5 transition-all">
            <span className="text-[10.5px] font-mono text-[#676c85] tracking-wider uppercase block">02 · Filings</span>
            <h3 className="text-base font-bold text-[#14172b] font-display">SEC Risk Audit</h3>
            <p className="text-[#565b74] text-xs leading-relaxed">
              Scans filings programmatically for debt covenants, lease liabilities, litigation disclosures, and accounting adjustments.
            </p>
          </div>

          {/* Sentiment Synthesis */}
          <div className="bg-white border border-[#e3e5ed] hover:border-[#d3d7e2] rounded-2xl p-7 space-y-3.5 hover:-translate-y-0.5 transition-all">
            <span className="text-[10.5px] font-mono text-[#676c85] tracking-wider uppercase block">03 · Market</span>
            <h3 className="text-base font-bold text-[#14172b] font-display">Sentiment Synthesis</h3>
            <p className="text-[#565b74] text-xs leading-relaxed">
              Evaluates real-time news velocity, active competitor filings, and compiles institutional sentiment trends.
            </p>
          </div>
        </div>
      </section>

      {/* ================= PIPELINE SECTION ================= */}
      <section className="py-22 bg-[#eef0f4] border-y border-[#e3e5ed] relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-[56ch] text-left mb-12">
            <span className="text-[11px] font-mono tracking-widest text-[#2563eb] uppercase font-semibold block mb-3">Under The Hood</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14172b] tracking-tight font-display mb-3">How a thesis gets built.</h2>
            <p className="text-[#565b74] text-sm leading-relaxed">
              A cyclic agent pipeline plans, searches, analyzes, and verifies before a single line of the report is written.
            </p>
          </div>

          {/* Pipeline Card Wrapper */}
          <div className="flex flex-col border border-[#e3e5ed] rounded-2xl overflow-hidden bg-white divide-y divide-[#e3e5ed]">
            {/* Step 1 */}
            <div className="grid grid-cols-[64px_1fr] gap-5 p-5.5 items-start">
              <span className="font-mono text-xs text-[#2563eb] border border-[#d3d7e2] rounded-lg w-9 h-9 flex items-center justify-center font-bold bg-[#f7f8fa]">01</span>
              <div>
                <h4 className="text-xs font-bold text-[#14172b] uppercase tracking-wider mt-1.5 font-display">Query Planner</h4>
                <p className="text-[#565b74] text-[11px] leading-relaxed mt-0.5">Structures the research question into a targeted search vector before any data is fetched.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-[64px_1fr] gap-5 p-5.5 items-start">
              <span className="font-mono text-xs text-[#2563eb] border border-[#d3d7e2] rounded-lg w-9 h-9 flex items-center justify-center font-bold bg-[#f7f8fa]">02</span>
              <div>
                <h4 className="text-xs font-bold text-[#14172b] uppercase tracking-wider mt-1.5 font-display">Search Executor</h4>
                <p className="text-[#565b74] text-[11px] leading-relaxed mt-0.5">Runs autonomous web queries to pull current filings, financial data, and market commentary.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-[64px_1fr] gap-5 p-5.5 items-start">
              <span className="font-mono text-xs text-[#2563eb] border border-[#d3d7e2] rounded-lg w-9 h-9 flex items-center justify-center font-bold bg-[#f7f8fa]">03</span>
              <div>
                <h4 className="text-xs font-bold text-[#14172b] uppercase tracking-wider mt-1.5 font-display">Deep Analysis Node</h4>
                <p className="text-[#565b74] text-[11px] leading-relaxed mt-0.5">Parses and scores every content snippet for relevance, recency, and signal quality.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="grid grid-cols-[64px_1fr] gap-5 p-5.5 items-start">
              <span className="font-mono text-xs text-[#2563eb] border border-[#d3d7e2] rounded-lg w-9 h-9 flex items-center justify-center font-bold bg-[#f7f8fa]">04</span>
              <div>
                <h4 className="text-xs font-bold text-[#14172b] uppercase tracking-wider mt-1.5 font-display">Fact Verification</h4>
                <p className="text-[#565b74] text-[11px] leading-relaxed mt-0.5">Cross-checks claims against persisted state before anything is allowed into the final report.</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="grid grid-cols-[64px_1fr] gap-5 p-5.5 items-start">
              <span className="font-mono text-xs text-[#2563eb] border border-[#d3d7e2] rounded-lg w-9 h-9 flex items-center justify-center font-bold bg-[#f7f8fa]">05</span>
              <div>
                <h4 className="text-xs font-bold text-[#14172b] uppercase tracking-wider mt-1.5 font-display">Report Generator</h4>
                <p className="text-[#565b74] text-[11px] leading-relaxed mt-0.5">Compiles the verified findings into a structured, institutional-grade research brief.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SAMPLE OUTPUT SECTION ================= */}
      <section className="py-22 relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
          <div className="space-y-3">
            <span className="text-[11px] font-mono tracking-widest text-[#2563eb] uppercase font-semibold block">Sample Output</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14172b] tracking-tight font-display leading-tight">A verdict, not a wall of text.</h2>
            <p className="text-[#565b74] text-xs sm:text-sm leading-relaxed max-w-md">
              Every research pass ends in a definitive Invest or Pass call, backed by the reasoning that produced it — not a pile of raw search results.
            </p>
          </div>

          {/* Translucent Mock Report Card */}
          <div className="bg-white border border-[#d3d7e2] rounded-2xl p-6 relative overflow-hidden shadow-md animate-float-y-1 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-[#14172b]">
                <strong className="text-sm">NVDA</strong> · NVIDIA Corp
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest bg-[#2563eb]/8 border border-[#2563eb]/35 text-[#2563eb] px-3 py-1 rounded-full font-bold">
                Invest
              </span>
            </div>
            
            {/* Polyline line graph */}
            <svg className="w-full h-11 my-4 text-[#16a34a]" width="100%" height="46" viewBox="0 0 260 46" preserveAspectRatio="none">
              <polyline points="0,34 26,30 52,32 78,22 104,26 130,16 156,20 182,10 208,14 234,4 260,8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs border-t border-[#e3e5ed] pt-3">
                <span className="text-[#565b74]">Revenue &amp; Growth</span>
                <span className="font-mono text-[10.5px] text-[#14172b] font-bold">Strong</span>
              </div>
              <div className="flex justify-between text-xs border-t border-[#e3e5ed] pt-3">
                <span className="text-[#565b74]">SEC Risk Audit</span>
                <span className="font-mono text-[10.5px] text-[#14172b] font-bold">Low Flag</span>
              </div>
              <div className="flex justify-between text-xs border-t border-[#e3e5ed] pt-3">
                <span className="text-[#565b74]">Competitor Sentiment</span>
                <span className="font-mono text-[10.5px] text-[#14172b] font-bold">Favorable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA BAND SECTION ================= */}
      <section className="py-22 bg-[#eef0f4] border-y border-[#e3e5ed] relative z-10 w-full">
        <div className="max-w-[48ch] mx-auto text-center space-y-6 px-6">
          <span className="text-[11px] font-mono tracking-widest text-[#2563eb] uppercase font-semibold block">Get Started</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14172b] tracking-tight font-display">Run your first research pass.</h2>
          <p className="text-[#565b74] text-xs sm:text-sm leading-relaxed">
            No account, no configuration. Enter a ticker and the pipeline does the rest.
          </p>

          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              onClick={() => router.push("/terminal")}
              className="group px-8.5 py-4 bg-[#2563eb] hover:bg-[#3b82f6] text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_0_1px_rgba(37,99,235,0.4),0_12px_28px_rgba(37,99,235,0.22)] hover:shadow-[0_0_0_1px_rgba(37,99,235,0.55),0_16px_34px_rgba(37,99,235,0.3)] active:scale-97 cursor-pointer flex items-center space-x-2 w-full justify-center"
            >
              <span>Launch Research Terminal</span>
              <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-[11px] text-[#676c85] font-mono tracking-wider">
              Secure Sandboxed Execution Space · No Authentication Required
            </span>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="w-full bg-[#eef0f4] border-t border-[#d3d7e2] z-30 relative">
        <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-1 bg-[#2563eb] rounded-lg">
                <Layers className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-[#14172b] font-display">InsideAlpha</span>
            </div>
            <p className="text-[#676c85] text-xs leading-relaxed max-w-[32ch]">
              Autonomous equity research, compiled instantly from live market and filing data.
            </p>
          </div>

          <div className="space-y-3.5">
            <h5 className="text-[11px] font-mono tracking-widest text-[#676c85] uppercase font-semibold">Product</h5>
            <ul className="space-y-2.5 text-xs text-[#565b74]">
              <li><a href="#" className="hover:text-[#14172b] transition-colors">Research Terminal</a></li>
              <li><a href="#" className="hover:text-[#14172b] transition-colors">Coverage Pillars</a></li>
              <li><a href="#" className="hover:text-[#14172b] transition-colors">Sample Reports</a></li>
            </ul>
          </div>

          <div className="space-y-3.5">
            <h5 className="text-[11px] font-mono tracking-widest text-[#676c85] uppercase font-semibold">Company</h5>
            <ul className="space-y-2.5 text-xs text-[#565b74]">
              <li><a href="#" className="hover:text-[#14172b] transition-colors">About</a></li>
              <li><a href="#" className="hover:text-[#14172b] transition-colors">Contact</a></li>
            </ul>
          </div>

          <div className="space-y-3.5">
            <h5 className="text-[11px] font-mono tracking-widest text-[#676c85] uppercase font-semibold">Legal</h5>
            <ul className="space-y-2.5 text-xs text-[#565b74]">
              <li><a href="#" className="hover:text-[#14172b] transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-[#14172b] transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-[#14172b] transition-colors">Disclaimer</a></li>
            </ul>
          </div>
        </div>

        {/* Status Deck */}
        <div className="border-t border-[#e3e5ed] py-6 text-center flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-6 text-[10.5px] font-mono text-[#676c85] tracking-widest gap-4">
          <div>
            © 2026 InsideAlpha. For research purposes only — not financial advice.
          </div>
          <div className="flex items-center space-x-3.5 uppercase">
            <span>[Core Node: Connected]</span>
            <span className="text-slate-300">|</span>
            <span>[Agent Workflow: LangGraph Orchestrated]</span>
            <span className="text-slate-300">|</span>
            <span>[Primary Node: Active]</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
