"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface AgentMeta {
  id: string;
  name: string;
  role: string;
  category: "Core" | "Finance" | "Strategic" | "Auditing";
  colorHex: string;
  colorInt: number;
  glowColor: string;
  throughput: string;
  accuracy: string;
  geometryType: "icosahedron" | "torus" | "octahedron" | "torusKnot" | "dodecahedron" | "rings";
  description: string;
  skills: string[];
}

export const AGENT_REGISTRY: Record<string, AgentMeta> = {
  MasterOrchestrator: {
    id: "MasterOrchestrator",
    name: "Master Orchestrator",
    role: "Autonomous Pipeline Commander",
    category: "Core",
    colorHex: "#d4a853",
    colorInt: 0xd4a853,
    glowColor: "rgba(212, 168, 83, 0.4)",
    throughput: "1,240 ops/sec",
    accuracy: "99.8%",
    geometryType: "icosahedron",
    description: "Central neural conductor that manages task dependency graphs, agent handoffs, and pipeline execution order.",
    skills: ["Pipeline Routing", "DAG Dependency Resolution", "Failure Recovery", "Agent Consensus"],
  },
  PLNormalization: {
    id: "PLNormalization",
    name: "P&L Normalization",
    role: "Financial Ingestion & Cleansing",
    category: "Finance",
    colorHex: "#63b3ed",
    colorInt: 0x63b3ed,
    glowColor: "rgba(99, 179, 237, 0.4)",
    throughput: "450k rows/sec",
    accuracy: "99.9%",
    geometryType: "rings",
    description: "Standardizes disparate portfolio chart of accounts, currency conversions, and GAAP/IFRS reporting structures.",
    skills: ["COA Mapping", "One-off Expense Normalization", "Pro-forma Adjustments", "Currency Arbitrage"],
  },
  MarginAnalysis: {
    id: "MarginAnalysis",
    name: "Margin Analysis",
    role: "Gross & EBITDA Compression Engine",
    category: "Finance",
    colorHex: "#48bb78",
    colorInt: 0x48bb78,
    glowColor: "rgba(72, 187, 120, 0.4)",
    throughput: "820 ops/sec",
    accuracy: "99.4%",
    geometryType: "octahedron",
    description: "Decomposes product-line margins, price elasticity, raw material variance, and gross margin leakages.",
    skills: ["Waterfall Decomposition", "Unit Margin Sensitivity", "EBITDA Bridge Analysis", "Price-Volume-Mix"],
  },
  CostStructure: {
    id: "CostStructure",
    name: "Cost Structure Sentinel",
    role: "OpEx & Fixed/Variable Breakdown",
    category: "Finance",
    colorHex: "#38bdf8",
    colorInt: 0x38bdf8,
    glowColor: "rgba(56, 189, 248, 0.4)",
    throughput: "640 ops/sec",
    accuracy: "98.9%",
    geometryType: "dodecahedron",
    description: "Segregates fixed, step-fixed, and variable operating expenses to model operating leverage across cyclicality.",
    skills: ["Fixed-Variable Decomposition", "SG&A Rationalization", "Headcount ROI Modeling", "Vendor Audit"],
  },
  RevenueQuality: {
    id: "RevenueQuality",
    name: "Revenue Quality Sentinel",
    role: "Recurring Churn & Concentration Forecaster",
    category: "Strategic",
    colorHex: "#4299e1",
    colorInt: 0x4299e1,
    glowColor: "rgba(66, 153, 225, 0.4)",
    throughput: "390k trans/sec",
    accuracy: "99.1%",
    geometryType: "torus",
    description: "Evaluates revenue predictability, cohort net dollar retention (NDR), customer lifetime value, and concentration risks.",
    skills: ["Cohort LTV/CAC", "Net Revenue Retention", "Customer Concentration", "Renewal Decay Curves"],
  },
  BenchmarkPeerAnalysis: {
    id: "BenchmarkPeerAnalysis",
    name: "Benchmark Peer Analysis",
    role: "Private Equity & Public Comps",
    category: "Strategic",
    colorHex: "#9f7aea",
    colorInt: 0x9f7aea,
    glowColor: "rgba(159, 122, 234, 0.4)",
    throughput: "1,100 comps/sec",
    accuracy: "99.3%",
    geometryType: "rings",
    description: "Bench-tests performance metrics against 1,500+ private equity backed companies and public sector peers.",
    skills: ["Quartile Percentile Scoring", "Industry EV/EBITDA Multiples", "Rule of 40 Testing", "CapEx Intensity"],
  },
  TrendDetection: {
    id: "TrendDetection",
    name: "Trend Detection",
    role: "Multi-Quarter Momentum Extractor",
    category: "Strategic",
    colorHex: "#b794f4",
    colorInt: 0xb794f4,
    glowColor: "rgba(183, 148, 244, 0.4)",
    throughput: "920 ops/sec",
    accuracy: "98.7%",
    geometryType: "torusKnot",
    description: "Extracts underlying growth momentum, inflection points, seasonal smoothing, and forward guidance trajectories.",
    skills: ["Time Series Decomposition", "Inflection Point Alerting", "Seasonality Calibration", "Momentum Velocity"],
  },
  AnomalyDetection: {
    id: "AnomalyDetection",
    name: "Anomaly Detection",
    role: "Outlier Sentinel & Fraud / Drift Alerting",
    category: "Auditing",
    colorHex: "#f56565",
    colorInt: 0xf56565,
    glowColor: "rgba(245, 101, 101, 0.45)",
    throughput: "2.1M pts/sec",
    accuracy: "99.7%",
    geometryType: "octahedron",
    description: "Identifies statistically significant anomalies in cost spikes, billing deviations, working capital swings, and ledger drift.",
    skills: ["Z-Score Outlier Isolation", "Benford's Law Auditing", "Working Capital Drift", "Sudden Margin Leakage"],
  },
  BestPracticeIdentification: {
    id: "BestPracticeIdentification",
    name: "Best Practice Engine",
    role: "PE Playbook & Margin Expansion Engine",
    category: "Strategic",
    colorHex: "#ed8936",
    colorInt: 0xed8936,
    glowColor: "rgba(237, 137, 54, 0.4)",
    throughput: "480 playbooks/sec",
    accuracy: "98.5%",
    geometryType: "dodecahedron",
    description: "Cross-pollinates high-performing strategies across portfolio assets, synthesizing actionable EBITDA uplift levers.",
    skills: ["Playbook Recommendation", "Working Capital Optimization", "Pricing Power Discovery", "Procurement Pooling"],
  },
  InsightGeneration: {
    id: "InsightGeneration",
    name: "Insight Generation",
    role: "Executive Synthesis & Memo Generation",
    category: "Core",
    colorHex: "#ed64a6",
    colorInt: 0xed64a6,
    glowColor: "rgba(237, 100, 166, 0.4)",
    throughput: "350 tokens/sec",
    accuracy: "99.5%",
    geometryType: "icosahedron",
    description: "Synthesizes multi-agent findings into high-conviction executive briefs, board presentation memos, and action checklists.",
    skills: ["Board Memo Synthesis", "Risk Scoring Summaries", "Value Creation Roadmaps", "LP Investor Briefings"],
  },
};

interface AgentAvatar3DProps {
  agentId: string;
  size?: number;
  interactive?: boolean;
  status?: "idle" | "running" | "completed" | "failed";
  className?: string;
}

export default function AgentAvatar3D({
  agentId,
  size = 72,
  interactive = true,
  status = "idle",
  className = "",
}: AgentAvatar3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const meta = AGENT_REGISTRY[agentId] || AGENT_REGISTRY["MasterOrchestrator"];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const testCanvas = document.createElement("canvas");
    const gl = testCanvas.getContext("webgl");
    if (!gl) return;

    const width = size;
    const height = size;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    let geometry: THREE.BufferGeometry;
    switch (meta.geometryType) {
      case "torus":
        geometry = new THREE.TorusGeometry(1.2, 0.4, 16, 32);
        break;
      case "octahedron":
        geometry = new THREE.OctahedronGeometry(1.4, 0);
        break;
      case "torusKnot":
        geometry = new THREE.TorusKnotGeometry(1.0, 0.28, 48, 16);
        break;
      case "dodecahedron":
        geometry = new THREE.DodecahedronGeometry(1.3, 0);
        break;
      case "rings":
        geometry = new THREE.RingGeometry(0.8, 1.4, 24);
        break;
      case "icosahedron":
      default:
        geometry = new THREE.IcosahedronGeometry(1.4, 0);
        break;
    }

    const wireMat = new THREE.MeshBasicMaterial({
      color: meta.colorInt,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const wireMesh = new THREE.Mesh(geometry, wireMat);
    group.add(wireMesh);

    const innerGeo = new THREE.SphereGeometry(0.65, 16, 16);
    const innerMat = new THREE.MeshStandardMaterial({
      color: meta.colorInt,
      emissive: meta.colorInt,
      emissiveIntensity: status === "running" ? 1.0 : 0.6,
      roughness: 0.3,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    let isHovered = false;
    const handleMouseEnter = () => {
      if (interactive) isHovered = true;
    };
    const handleMouseLeave = () => {
      isHovered = false;
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    let animId: number;
    const clock = new THREE.Clock();

    const render = () => {
      animId = requestAnimationFrame(render);
      const delta = clock.getDelta();
      const speedMult = isHovered ? 2.8 : status === "running" ? 2.2 : 1.0;

      group.rotation.x += delta * 0.6 * speedMult;
      group.rotation.y += delta * 0.9 * speedMult;

      if (status === "running") {
        const pulse = 1 + Math.sin(clock.getElapsedTime() * 6) * 0.08;
        innerMesh.scale.set(pulse, pulse, pulse);
      }

      renderer.render(scene, camera);
    };

    render();

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      wireMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
    };
  }, [meta, size, interactive, status]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 cursor-pointer rounded-full overflow-hidden transition-all duration-300 ${className}`}
    >
      <div
        className="absolute inset-0 rounded-full opacity-25 blur-md pointer-events-none"
        style={{ backgroundColor: meta.colorHex }}
      />
      {status === "running" && (
        <span
          className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full animate-ping pointer-events-none"
          style={{ backgroundColor: meta.colorHex }}
        />
      )}
    </div>
  );
}
