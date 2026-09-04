"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useAuthStore } from "../../store/authStore";
import { AuthModal } from "../../components/auth/AuthModal";
import AgentDossierModal from "../../components/canvas/AgentDossierModal";
import { AGENT_REGISTRY } from "../../components/canvas/AgentAvatar3D";
import {
  ArrowRight,
  ChevronDown,
  Shield,
  BarChart3,
  TrendingUp,
  AlertCircle,
  FileText,
  Check,
  Plus,
  Minus,
} from "lucide-react";

// Lazy-load heavy 3D canvas components (only on client)
const PortfolioGlobe = dynamic(
  () => import("../../components/canvas/PortfolioGlobe"),
  { ssr: false, loading: () => <div className="w-full h-full" /> }
);
const MintlifyWaveCanvas = dynamic(
  () => import("../../components/canvas/MintlifyWaveCanvas"),
  { ssr: false, loading: () => <div className="w-full h-full" /> }
);
const StarfieldCanvas = dynamic(
  () => import("../../components/canvas/StarfieldCanvas"),
  { ssr: false, loading: () => null }
);

// ─────────────────────────────────────────────────────────────────────────────
// Animation helpers
// ─────────────────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 44 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = (delayChildren = 0.08, staggerChildren = 0.12) => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
});

function FadeInSection({ children, className = "", delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // once: false → re-animates every time the section enters/leaves viewport
  const inView = useInView(ref, { once: false, margin: "-8% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const METRICS = [
  { value: "$1.2B+", label: "Portfolio Under Management", sub: "Across 10 active fund companies" },
  { value: "+165 bps", label: "Average EBITDA Expansion", sub: "Identified in the first 90 days" },
  { value: "32 sec", label: "Board Pack Generation", sub: "Full IC memo from raw ledger data" },
  { value: "99.8%", label: "Calculation Accuracy", sub: "Deterministic SQL-verified output" },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "COA Harmonization",
    description:
      "Ingests NetSuite, SAP, QuickBooks, and Sage ledgers simultaneously. DuckDB normalizes disparate charts of accounts into a unified GAAP EBITDA structure — no spreadsheets, no manual mapping.",
    metric: "450,000 rows / sec",
    color: "#d4a853", // brand gold
  },
  {
    icon: TrendingUp,
    title: "EBITDA Waterfall Bridges",
    description:
      "Automatically decomposes price-volume-mix variances, unrecovered freight surcharges, and OpEx creep. Quantifies exact recoverable basis points before the quarter closes.",
    metric: "+165 bps avg. recovered",
    color: "#cbd5e1", // slate-300 (silver)
  },
  {
    icon: AlertCircle,
    title: "Continuous Anomaly Sentinel",
    description:
      "Runs Benford's Law and Z-score algorithms on 100% of journal vouchers every 24 hours. Alerts operating partners the instant a price drift, duplicate invoice, or margin leak appears.",
    metric: "24 hr detection cycle",
    color: "#d4a853", // brand gold
  },
  {
    icon: FileText,
    title: "Institutional Board Pack Engine",
    description:
      "One click generates a board-ready Investment Committee memo complete with waterfall bridges, benchmarked against 1,500+ private equity peers — in 32 seconds.",
    metric: "1,500+ PE benchmarks",
    color: "#cbd5e1", // slate-300 (silver)
  },
];

const PROBLEMS = [
  {
    before: "3 weeks reconciling Excel workbooks with broken VLOOKUPs",
    after: "Sub-second DuckDB ledger ingestion from any ERP",
  },
  {
    before: "Margin leakage caught 45 days after quarter-close",
    after: "Daily anomaly alerts before any damage compounds",
  },
  {
    before: "80+ associate hours building board presentation decks",
    after: "32-second IC memo with full data lineage",
  },
  {
    before: "Static, stale PDF reports sent by email",
    after: "Live portfolio intelligence dashboard, always current",
  },
];

const FAQS = [
  {
    q: "How does PeakIntel connect to our portfolio companies' ERP systems?",
    a: "PeakIntel ships pre-built, read-only API connectors for NetSuite, SAP S/4HANA, QuickBooks Enterprise, Sage Intacct, and Microsoft Dynamics 365. Onboarding a portfolio company typically takes under 24 hours — no custom engineering required.",
  },
  {
    q: "How does PeakIntel prevent AI hallucinations in financial outputs?",
    a: "Every metric is computed by our deterministic DuckDB in-memory SQL engine before any language model touches the data. LLMs only compose narrative around pre-verified numbers — each output is traceable back to its source journal voucher.",
  },
  {
    q: "Can portfolio companies see each other's financials?",
    a: "Never. Row-level multi-tenant isolation means each company's ledger is encrypted with isolated customer-managed keys. Operating partners see consolidated fund rollups; portfolio CFOs only see their own company workspace.",
  },
  {
    q: "What EBITDA margin expansion should we realistically expect?",
    a: "Our active portfolios average +120–165 basis points in actionable EBITDA recovery within 90 days. Primary drivers include unrecovered freight surcharges, duplicate SaaS subscriptions, vendor price drift, and working capital optimization.",
  },
  {
    q: "What security certifications does PeakIntel hold?",
    a: "SOC 2 Type II certified, ISO 27001 compliant. We support enterprise SAML 2.0 / Okta SSO, granular RBAC, and 256-bit AES encryption in transit and at rest. All ERP connections are strictly read-only.",
  },
];

const AGENT_KEYS = Object.keys(AGENT_REGISTRY).slice(0, 10);

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 relative group"
    >
      {children}
      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
    </a>
  );
}

function FaqItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-5% 0px" }}
      transition={{ duration: 0.5, delay: idx * 0.07 }}
      className="border-b border-zinc-800/70"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-5 flex items-center justify-between gap-4 text-left cursor-pointer group"
      >
        <span className="text-sm sm:text-base font-medium text-zinc-100 group-hover:text-white transition-colors">
          {q}
        </span>
        <span className="shrink-0 w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:border-zinc-500 transition-colors">
          {open ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-zinc-400 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.97]);
  const heroY = useTransform(scrollY, [0, 500], [0, -60]);

  useEffect(() => {
    const unsub = scrollY.on("change", (v) => setScrolled(v > 40));
    return unsub;
  }, [scrollY]);

  const openSignup = () => { setAuthTab("signup"); setAuthOpen(true); };
  const openSignin = () => { setAuthTab("signin"); setAuthOpen(true); };
  const handleLaunch = () => isAuthenticated ? router.push("/") : openSignin();

  return (
    <div className="relative min-h-screen bg-[#080A0C] text-zinc-100 overflow-x-hidden font-sans">

      {/* ── STARFIELD — fixed full-page background ─── */}
      <StarfieldCanvas />

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#080A0C]/90 backdrop-blur-xl border-b border-white/5" : ""
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="PeakIntel Equity Group"
              width={40}
              height={40}
              className="h-9 w-auto object-contain"
            />
            <span className="font-semibold text-sm text-white tracking-tight">PeakIntel</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            <NavLink href="#why">Why PeakIntel</NavLink>
            <NavLink href="#platform">Platform</NavLink>
            <NavLink href="#agents">Agents</NavLink>
            <NavLink href="#faqs">FAQ</NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/"
                className="h-9 px-4 rounded-md bg-white text-[#080A0C] text-xs font-semibold hover:bg-zinc-100 transition-colors flex items-center gap-1.5"
              >
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <button
                  onClick={openSignin}
                  className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Sign in
                </button>
                <button
                  onClick={openSignup}
                  className="h-9 px-4 rounded-md bg-white text-[#080A0C] text-xs font-semibold hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">

          {/* Radial gradient center glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_60%,rgba(14,165,233,0.06),transparent)]" />
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#080A0C] to-transparent" />
          </div>

          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
            className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center gap-7"
          >
            {/* Eyebrow tag */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-zinc-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PeakIntel Platform v2.4 — Now live for private equity teams
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] text-white leading-[1.07]"
            >
              Financial intelligence
              <br />
              <span className="text-zinc-400 font-light italic">for private equity</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed"
            >
              Eliminate weeks of spreadsheet reconciliation. PeakIntel standardizes portfolio ledgers,
              surfaces unrecovered EBITDA, and generates board-ready memos — in seconds, not months.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              <button
                onClick={openSignup}
                className="h-11 px-6 rounded-lg bg-white text-[#080A0C] text-sm font-semibold hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                Start free trial
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleLaunch}
                className="h-11 px-6 rounded-lg border border-white/10 bg-white/5 text-sm text-zinc-200 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              >
                View live demo
              </button>
            </motion.div>

            {/* Trust line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-xs text-zinc-500 flex items-center gap-2"
            >
              <Shield className="w-3.5 h-3.5" /> SOC 2 Type II · 256-bit AES encryption · Read-only ERP access
            </motion.p>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 text-zinc-600 flex flex-col items-center gap-1"
          >
            {/* <ChevronDown className="w-5 h-5 animate-bounce" /> */}
          </motion.div>
        </section>

        {/* ── METRICS STRIP ────────────────────────────────────────────────── */}
        <section className="border-y border-zinc-800/50 bg-[#080A0C]/40">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-zinc-800/50">
              {METRICS.map((m, i) => (
                <FadeInSection key={i} delay={i * 0.08} className="py-10 px-8 text-center">
                  <p className="text-3xl lg:text-4xl font-bold text-white tracking-tight font-mono">{m.value}</p>
                  <p className="text-sm font-medium text-zinc-200 mt-1">{m.label}</p>
                  <p className="text-xs text-zinc-500 mt-1">{m.sub}</p>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY SECTION: PROBLEM ─────────────────────────────────────────── */}
        <section id="why" className="py-28 lg:py-36 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_70%_50%,rgba(14,165,233,0.04),transparent)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

              {/* Left: Text */}
              <div className="space-y-10">
                <FadeInSection>
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">The Problem</p>
                  <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mt-3 leading-[1.1]">
                    Portfolio finance is still stuck in 2005
                  </h2>
                  <p className="text-zinc-400 text-base leading-relaxed mt-4">
                    Operating partners spend months reconciling ledgers, hunting for margin leakage,
                    and assembling board packs — by hand. Every week of delay costs recoverable EBITDA.
                  </p>
                </FadeInSection>

                {/* ── Comparison table: 2-column "Before vs After" ── */}
                <FadeInSection delay={0.15}>
                  {/* Column headers */}
                  <div className="grid grid-cols-2 gap-px mb-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">Legacy approach</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                      style={{ background: "rgba(212,168,83,0.06)", borderColor: "rgba(212,168,83,0.22)" }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                        style={{ backgroundColor: "#d4a853" }} />
                      <span className="text-[10px] font-mono uppercase tracking-widest"
                        style={{ color: "#d4a853" }}>With PeakIntel</span>
                    </div>
                  </div>

                  {/* Rows */}
                  <div className="rounded-xl overflow-hidden border border-zinc-800/50 divide-y divide-zinc-800/50">
                    {PROBLEMS.map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, margin: "-5% 0px" }}
                        transition={{ duration: 0.45, delay: i * 0.09 }}
                        className="group grid grid-cols-2 gap-px"
                      >
                        {/* Before cell */}
                        <div className="relative flex items-start gap-3 px-4 py-4 bg-[#0d0f12] group-hover:bg-[#111316] transition-colors duration-200">
                          <span className="mt-0.5 shrink-0 w-5 h-5 rounded-md bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-[10px] font-bold text-stone-500 font-mono">
                            {i + 1}
                          </span>
                          <p className="text-xs text-stone-500/70 leading-relaxed line-through decoration-stone-600/40">
                            {p.before}
                          </p>
                          <div className="absolute right-0 inset-y-0 w-px bg-zinc-800/50" />
                        </div>

                        {/* After cell */}
                        <div className="flex items-start gap-3 px-4 py-4 bg-[#0d0b08] group-hover:bg-[#110f0a] transition-colors duration-200">
                          <div className="mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center border"
                            style={{ background: "rgba(212,168,83,0.1)", borderColor: "rgba(212,168,83,0.25)" }}>
                            <Check className="w-3 h-3" style={{ color: "#d4a853" }} />
                          </div>
                          <p className="text-xs leading-relaxed font-medium"
                            style={{ color: "rgba(212,168,83,0.85)" }}>
                            {p.after}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </FadeInSection>
              </div>

              {/* Right: 3D Globe */}
              <FadeInSection className="relative">
                <div className="relative h-[480px] lg:h-[560px]">
                  {/* Glow behind globe */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-80 h-80 rounded-full bg-sky-500/5 blur-3xl" />
                  </div>
                  <PortfolioGlobe className="w-full h-full" />

                  {/* Floating overlay cards */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 -left-4 lg:-left-8 bg-[#0F1318] border border-zinc-800 rounded-xl p-3.5 shadow-xl w-48"
                  >
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Portfolio EBITDA</p>
                    <p className="text-xl font-bold text-white font-mono mt-0.5">$124.7M</p>
                    <p className="text-xs text-sky-400 mt-0.5">+5.1% YoY · 10 countries</p>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute bottom-16 -right-4 lg:-right-8 bg-[#0F1318] border border-zinc-800 rounded-xl p-3.5 shadow-xl w-52"
                  >
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">⚠ Anomaly Alert</p>
                    <p className="text-sm font-semibold text-orange-400 mt-1 leading-snug">Vendor price drift — Sydney, AU 🇦🇺</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Detected 2 hrs ago · $340K at risk</p>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-4 left-4 bg-[#0F1318] border border-zinc-800 rounded-xl p-3.5 shadow-xl"
                  >
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Active hubs</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {[
                        { flag: "🇺🇸", ok: true }, { flag: "🇬🇧", ok: true }, { flag: "🇫🇷", ok: true },
                        { flag: "🇯🇵", ok: false }, { flag: "🇸🇬", ok: true }, { flag: "🇭🇰", ok: false },
                        { flag: "🇮🇳", ok: true }, { flag: "🇦🇪", ok: false }, { flag: "🇦🇺", ok: false }, { flag: "🇺🇸", ok: true },
                      ].map((n, i) => (
                        <div key={i} className="text-sm leading-none" title={n.ok ? "Active" : "Watch"}>{n.flag}</div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </FadeInSection>
            </div>
          </div>
        </section>

        {/* ── PLATFORM FEATURES ────────────────────────────────────────────── */}
        <section id="platform" className="py-28 lg:py-36 border-t border-zinc-800/50 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_30%_30%,rgba(139,92,246,0.04),transparent)] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 lg:px-10">

            <FadeInSection className="max-w-2xl mb-20">
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">The Platform</p>
              <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mt-3 leading-[1.1]">
                Four analytical engines.<br />
                <span className="text-zinc-500 font-light italic">One unified workspace.</span>
              </h2>
            </FadeInSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: "-8% 0px" }}
                    transition={{ duration: 0.65, delay: (i % 2) * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{
                      y: -8,
                      rotateX: 4,
                      rotateY: i % 2 === 0 ? -3 : 3,
                      scale: 1.02,
                      transition: { duration: 0.3, ease: "easeOut" },
                    }}
                    style={{ transformStyle: "preserve-3d", perspective: 1000 }}
                    className="group relative rounded-2xl border border-zinc-800 bg-[#0d0f12] p-8 overflow-hidden cursor-default"
                  >
                    {/* Animated gradient sweep on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: `radial-gradient(ellipse 120% 80% at 50% 0%, ${f.color}10 0%, transparent 70%)` }}
                    />
                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] [background-size:32px_32px]" />
                    {/* Corner glow on hover */}
                    <div 
                      className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl pointer-events-none"
                      style={{ backgroundColor: f.color }} 
                    />

                    <div className="relative z-10 space-y-4">
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="w-10 h-10 rounded-xl border border-zinc-700 bg-zinc-800/40 flex items-center justify-center transition-colors duration-300"
                        style={{ color: f.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-white transition-colors">{f.title}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors duration-300">{f.description}</p>
                      <div className="text-xs font-mono font-bold pt-2 flex items-center gap-2" style={{ color: f.color }}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'currentColor' }} />
                        {f.metric}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── AGENTS SECTION ───────────────────────────────────────────────── */}
        <section id="agents" className="py-28 lg:py-36 border-t border-zinc-800/50">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">

            <FadeInSection className="max-w-2xl mb-20">
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Analytical Agents</p>
              <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mt-3 leading-[1.1]">
                10 specialized agents.<br />
                <span className="text-zinc-500 font-light italic">Zero manual work.</span>
              </h2>
              <p className="text-zinc-400 text-base leading-relaxed mt-4">
                Each agent handles a distinct financial workflow — from ledger ingestion to board memo synthesis.
                Click any agent to inspect its methodology and capabilities.
              </p>
            </FadeInSection>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {AGENT_KEYS.map((key, i) => {
                const agent = AGENT_REGISTRY[key];
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: "-5% 0px" }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                    whileHover={{
                      y: -6,
                      scale: 1.03,
                      borderColor: agent.colorHex + "60",
                      transition: { duration: 0.22, ease: "easeOut" },
                    }}
                    onClick={() => setSelectedAgent(key)}
                    className="group relative rounded-xl border border-zinc-800 bg-[#0D1117] p-5 flex flex-col gap-3 cursor-pointer overflow-hidden"
                    style={{ boxShadow: "0 0 0 0 transparent" }}
                  >
                    {/* Glow on hover via pseudo-background */}
                    <motion.div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                      style={{ background: `radial-gradient(ellipse 100% 60% at 50% 0%, ${agent.colorHex}12, transparent 80%)` }}
                    />

                    {/* Colored dot top-right — pulsing */}
                    <div
                      className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: agent.colorHex, boxShadow: `0 0 8px ${agent.colorHex}80` }}
                    />

                    {/* Category chip */}
                    <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-mono">{agent.category}</span>

                    {/* Agent name */}
                    <div>
                      <p className="text-sm font-semibold text-white leading-snug group-hover:text-white transition-colors">{agent.name}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug line-clamp-2 group-hover:text-zinc-400 transition-colors">{agent.role}</p>
                    </div>

                    {/* Accuracy bar */}
                    <div className="w-full h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: agent.accuracy }}
                        viewport={{ once: false }}
                        transition={{ duration: 0.9, delay: i * 0.05, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: agent.colorHex }}
                      />
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono" style={{ color: agent.colorHex }}>{agent.accuracy}</span>
                      <motion.span
                        className="text-[10px] text-zinc-600 group-hover:text-zinc-300"
                        animate={{ x: [0, 2, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        Inspect →
                      </motion.span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── TRUST / SECURITY ─────────────────────────────────────────────── */}
        <section className="py-28 lg:py-36 border-t border-zinc-800/50 ">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              <FadeInSection className="space-y-6">
                <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Enterprise Security</p>
                <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.1]">
                  Built for institutional<br />
                  <span className="text-zinc-500 font-light italic">due diligence</span>
                </h2>
                <p className="text-zinc-400 leading-relaxed">
                  Every fund interaction goes through multi-layer encryption, isolated tenant storage,
                  and deterministic SQL verification. We never write to your ledgers.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    "SOC 2 Type II", "ISO 27001", "256-bit AES", "SAML 2.0 / SSO",
                    "Row-level isolation", "Read-only ERP access", "Audit data lineage", "RBAC controls",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-zinc-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </FadeInSection>

              <FadeInSection delay={0.15}>
                <div className="space-y-3">
                  {[
                    { label: "ERP Connection", status: "Read-Only Sandbox", ok: true },
                    { label: "Ledger Encryption", status: "AES-256 at rest & in transit", ok: true },
                    { label: "Tenant Isolation", status: "Row-level segregation active", ok: true },
                    { label: "Data Writes", status: "Blocked — PeakIntel never mutates source", ok: true },
                    { label: "Audit Trail", status: "Every metric → source journal voucher", ok: true },
                  ].map((row, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: false }}
                      whileHover={{ x: 4, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.45, delay: i * 0.09 }}
                      className="group flex items-center justify-between px-5 py-3.5 rounded-xl border border-zinc-800 bg-[#0D1117] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 cursor-default"
                    >
                      <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">{row.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 hidden sm:block group-hover:text-zinc-400 transition-colors">{row.status}</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </FadeInSection>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIAL PULL-QUOTE ───────────────────────────────────────── */}
        <section className="py-28 lg:py-32 border-t border-zinc-800/50 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <MintlifyWaveCanvas className="w-full h-full" particleColor="#0ea5e9" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <FadeInSection>
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-8">Case Study</p>
              <motion.blockquote
                className="text-2xl sm:text-3xl font-medium text-white leading-relaxed"
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                &ldquo;PeakIntel turned our monthly financial reviews from reactive arguments into
                forward-looking EBITDA execution sprints. We recovered 165 basis points we didn&apos;t
                know we were leaving on the table.&rdquo;
              </motion.blockquote>
              <div className="mt-8 flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-400">HC</div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Operating Partner</p>
                  <p className="text-xs text-zinc-500">Horizon Capital · $340M Buyout Fund</p>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section id="faqs" className="py-28 lg:py-36 border-t border-zinc-800/50">
          <div className="max-w-3xl mx-auto px-6 lg:px-10">
            <FadeInSection className="mb-16">
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">FAQ</p>
              <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mt-3 leading-[1.1]">
                Common questions
              </h2>
            </FadeInSection>

            <div>
              {FAQS.map((f, i) => (
                <FaqItem key={i} q={f.q} a={f.a} idx={i} />
              ))}
            </div>

            <FadeInSection delay={0.3} className="mt-12 p-6 rounded-2xl border border-zinc-800 bg-[#0D1117] flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Still have questions about your portfolio setup?</p>
                <p className="text-xs text-zinc-500 mt-1">Our private equity solutions architects respond within one business day.</p>
              </div>
              <button
                onClick={openSignup}
                className="shrink-0 h-9 px-4 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Contact sales
              </button>
            </FadeInSection>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
        <section className="py-28 lg:py-36 border-t border-zinc-800/50 ">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <FadeInSection className="space-y-8">
              <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.1]">
                Connect your portfolio.<br />
                <span className="text-zinc-500 font-light italic">Find the EBITDA you&apos;re missing.</span>
              </h2>
              <p className="text-zinc-400 text-base leading-relaxed">
                Onboard a portfolio company in under 24 hours. No engineering work.
                No manual mapping. Just clean, verified financial intelligence from day one.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={openSignup}
                  className="h-11 px-7 rounded-lg bg-white text-[#080A0C] text-sm font-semibold hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  Start free trial
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLaunch}
                  className="h-11 px-7 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white transition-all cursor-pointer"
                >
                  View live demo
                </button>
              </div>
              <p className="text-xs text-zinc-600">No credit card required · SOC 2 certified · Cancel anytime</p>
            </FadeInSection>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-zinc-800/50 overflow-hidden bg-black/60">
        {/* ── Big faded backdrop text ── */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden"
        >
          <span
            className="text-[clamp(5rem,18vw,16rem)] font-black tracking-[-0.04em] uppercase whitespace-nowrap"
            style={{
              color: "transparent",
              WebkitTextStroke: "1px rgba(255,255,255,0.04)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              userSelect: "none",
            }}
          >
            PEAKINTEL.AI
          </span>
        </div>

        {/* ── Footer content ── */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-10">

          {/* Top row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-zinc-800/50">

            {/* Brand */}
            <div className="space-y-4 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="PeakIntel" width={36} height={36} className="h-8 w-auto object-contain" />
                <span className="text-sm font-semibold text-white">PeakIntel</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-[220px]">
                Autonomous financial intelligence for private equity operating partners.
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-zinc-500">All systems operational</span>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white uppercase tracking-widest">Platform</p>
              {["COA Harmonization", "EBITDA Waterfall", "Anomaly Detection", "Board Pack Engine", "Agent Network"].map((l) => (
                <a key={l} href="#platform" className="block text-xs text-zinc-500 hover:text-zinc-300 transition-colors">{l}</a>
              ))}
            </div>

            {/* Company */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white uppercase tracking-widest">Company</p>
              {["About PeakIntel", "Security & Compliance", "Case Studies", "Careers", "Contact Sales"].map((l) => (
                <button key={l} onClick={openSignup} className="block text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">{l}</button>
              ))}
            </div>

            {/* Get started CTA */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-white uppercase tracking-widest">Get started</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Connect your first portfolio company in under 24 hours.
              </p>
              <button
                onClick={openSignup}
                className="h-9 px-4 rounded-lg bg-white text-[#080A0C] text-xs font-semibold hover:bg-zinc-100 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                Start free trial <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5 pt-1">
                <Shield className="w-3 h-3 text-zinc-600" />
                <span className="text-[10px] text-zinc-600">SOC 2 Type II certified</span>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-zinc-700">© 2026 PeakIntel AI, Inc. All rights reserved. · Privacy · Terms</p>
            <div className="flex items-center gap-5 text-[11px] text-zinc-700">
              <span>SOC 2 Type II</span>
              <span>·</span>
              <span>ISO 27001</span>
              <span>·</span>
              <span>256-bit AES</span>
              <span>·</span>
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── MODALS ──────────────────────────────────────────────────────────── */}
      <AgentDossierModal
        agentId={selectedAgent}
        onClose={() => setSelectedAgent(null)}
        onTriggerRun={() => router.push("/agents")}
      />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} />
    </div>
  );
}
