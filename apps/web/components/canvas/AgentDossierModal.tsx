"use client";

import React from "react";
import { AGENT_REGISTRY, AgentMeta } from "./AgentAvatar3D";
import AgentAvatar3D from "./AgentAvatar3D";
import { X, Activity, Cpu, ShieldCheck, Zap, Terminal, Play } from "lucide-react";

interface AgentDossierModalProps {
  agentId: string | null;
  onClose: () => void;
  onTriggerRun?: (agentId: string) => void;
  isTriggering?: boolean;
}

export default function AgentDossierModal({
  agentId,
  onClose,
  onTriggerRun,
  isTriggering = false,
}: AgentDossierModalProps) {
  if (!agentId) return null;
  const agent: AgentMeta = AGENT_REGISTRY[agentId] || AGENT_REGISTRY["MasterOrchestrator"];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${agent.colorHex}, transparent)`,
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-background/60 border border-border">
              <AgentAvatar3D agentId={agent.id} size={64} interactive={true} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-full"
                  style={{
                    backgroundColor: `${agent.colorHex}20`,
                    color: agent.colorHex,
                    border: `1px solid ${agent.colorHex}40`,
                  }}
                >
                  {agent.category} Agent
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground mt-1 tracking-tight">
                {agent.name}
              </h2>
              <p className="text-xs text-muted-foreground">{agent.role}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Telemetry Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-background/50 border border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Throughput</span>
              </div>
              <p className="text-sm font-bold text-foreground font-mono">{agent.throughput}</p>
            </div>

            <div className="p-3 rounded-xl bg-background/50 border border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Precision</span>
              </div>
              <p className="text-sm font-bold text-emerald-400 font-mono">{agent.accuracy}</p>
            </div>

            <div className="p-3 rounded-xl bg-background/50 border border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Latency</span>
              </div>
              <p className="text-sm font-bold text-foreground font-mono">18ms avg</p>
            </div>

            <div className="p-3 rounded-xl bg-background/50 border border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span>Model Base</span>
              </div>
              <p className="text-sm font-bold text-foreground font-mono">AGY-Pro v2</p>
            </div>
          </div>

          {/* Core Mission */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Neural Objective
            </h4>
            <p className="text-sm text-foreground/90 leading-relaxed bg-background/40 p-3.5 rounded-xl border border-border">
              {agent.description}
            </p>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Operational Skill Capabilities
            </h4>
            <div className="flex flex-wrap gap-2">
              {agent.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 text-xs rounded-lg bg-background/60 border border-border text-foreground font-mono flex items-center gap-1.5"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: agent.colorHex }}
                  />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Telemetry Log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                Autonomous Telemetry Log
              </h4>
              <span className="text-[10px] font-mono text-emerald-400">STATUS: READY</span>
            </div>
            <div className="bg-background/80 rounded-xl p-3 border border-border font-mono text-xs text-muted-foreground space-y-1">
              <p className="text-primary">
                [sys] Initialized worker daemon for {agent.name}
              </p>
              <p className="text-muted-foreground">
                [sync] Vector index aligned with portfolio ledger cache (10 companies)
              </p>
              <p className="text-foreground/80">
                [telemetry] Health check ping acknowledged: RTT 2.4ms, 0 packet loss
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 px-6 bg-background/40 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Close Dossier
          </button>

          <button
            onClick={() => onTriggerRun?.(agent.id)}
            disabled={isTriggering}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {isTriggering ? "Executing Pipeline..." : `Run ${agent.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}
