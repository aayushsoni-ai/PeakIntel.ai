"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAgentSocket } from "@/hooks/useAgentSocket";
import {
  AgentStatusDot,
  LoadingSpinner,
} from "@/components/shared";
import { Play, Clock, Wifi, WifiOff, Trash2 } from "lucide-react";
import AgentAvatar3D, { AGENT_REGISTRY } from "@/components/canvas/AgentAvatar3D";
type AgentRun = {
  id: string;
  agentName: string;
  status: "running" | "completed" | "failed";
  triggerType: "scheduled" | "event" | "manual";
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  resultSummary: unknown;
};

type RunAnalysisMutation = {
  mutate: () => void;
  isPending: boolean;
};

const AGENTS = [
  "MasterOrchestrator",
  "PLNormalization",
  "MarginAnalysis",
  "CostStructure",
  "RevenueQuality",
  "BenchmarkPeerAnalysis",
  "TrendDetection",
  "AnomalyDetection",
  "BestPracticeIdentification",
  "InsightGeneration",
];

export default function AgentsPage() {
  const utils = trpc.useUtils();
  const { connected, agentStatuses, recentEvents, clearHistory } = useAgentSocket();

  const { data: rawRecentRuns, isLoading } = trpc.agents.getRecentRuns.useQuery({
    limit: 20,
  });

  const recentRuns: AgentRun[] = (rawRecentRuns ?? []) as unknown as AgentRun[];
  const runMutation = trpc.agents.runFullAnalysis.useMutation();
  const clearMutation = trpc.agents.clearRecentRuns.useMutation({
    onSuccess: () => {
      utils.agents.getRecentRuns.invalidate();
      clearHistory();
    },
  });

  const runAnalysis = runMutation as unknown as RunAnalysisMutation;

  // Removed auto-clear on mount. History will now persist when navigating away.

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all run history and stop any active agents?")) {
      clearMutation.mutate();
    }
  };

  const getNextRunTimes = () => {
    const now = new Date();
    
    // Daily: 7:00 AM
    let dailyDate = new Date(now);
    dailyDate.setHours(7, 0, 0, 0);
    if (now > dailyDate) dailyDate.setDate(dailyDate.getDate() + 1);
    const isTomorrow = dailyDate.getDate() !== now.getDate();
    const dailyStr = `${isTomorrow ? "Tomorrow" : "Today"}, 7:00 AM`;

    // Weekly: Next Monday, 6:00 AM
    let weeklyDate = new Date(now);
    weeklyDate.setHours(6, 0, 0, 0);
    let daysUntilMonday = (1 - weeklyDate.getDay() + 7) % 7;
    if (daysUntilMonday === 0 && now > weeklyDate) daysUntilMonday = 7;
    weeklyDate.setDate(weeklyDate.getDate() + daysUntilMonday);
    // If it's today or tomorrow, it might be confusing, but 'Monday, 6:00 AM' is consistent.
    // Let's add the exact date for clarity.
    const weeklyStr = `${weeklyDate.toLocaleString("en-US", { month: "short", day: "numeric" })} (Mon), 6:00 AM`;

    // Monthly: 1st of month, 4:00 AM
    let monthlyDate = new Date(now.getFullYear(), now.getMonth(), 1, 4, 0, 0, 0);
    if (now > monthlyDate) {
      monthlyDate = new Date(now.getFullYear(), now.getMonth() + 1, 1, 4, 0, 0, 0);
    }
    const monthlyStr = `${monthlyDate.toLocaleString("en-US", { month: "long" })} 1, 4:00 AM`;

    return { dailyStr, weeklyStr, monthlyStr };
  };

  const { dailyStr, weeklyStr, monthlyStr } = getNextRunTimes();

  const schedules = [
    { label: "Daily Flash", cron: "7:00 AM daily", next: dailyStr },
    { label: "Weekly Analysis", cron: "Monday 6:00 AM", next: weeklyStr },
    { label: "Monthly Review", cron: "1st of month, 4:00 AM", next: monthlyStr },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor autonomous agent pipeline and trigger manual runs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs ${connected ? "text-emerald-400" : "text-red-400"}`}>
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="font-semibold">Agent Pipeline</h3>
              <button
                onClick={() => runAnalysis.mutate()}
                disabled={runAnalysis.isPending}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {runAnalysis.isPending ? "Starting..." : "Run Full Analysis"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {AGENTS.map((agent) => {
                const status = agentStatuses.get(agent);
                const meta = AGENT_REGISTRY[agent];
                return (
                  <div
                    key={agent}
                    className="p-3 rounded-xl bg-background/50 border border-border/60 hover:border-primary/50 hover:bg-background/80 transition-all group flex flex-col items-center text-center relative overflow-hidden"
                  >
                    <div className="w-full flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground uppercase tracking-wider">
                        {meta?.category || "Agent"}
                      </span>
                      <div className="flex items-center gap-1">
                        <AgentStatusDot status={status?.status ?? "idle"} />
                        <span className="text-[9px] text-muted-foreground uppercase font-mono">
                          {status?.status ?? "idle"}
                        </span>
                      </div>
                    </div>

                    {/* Animated 3D Avatar Symbol */}
                    <div className="my-1.5 flex items-center justify-center relative">
                      <AgentAvatar3D
                        agentId={agent}
                        size={56}
                        status={status?.status ?? "idle"}
                        interactive={false}
                      />
                    </div>

                    <p className="text-xs font-semibold text-foreground truncate w-full group-hover:text-primary transition-colors">
                      {meta?.name || agent}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate w-full mt-0.5">
                      {status?.lastEvent?.message || meta?.role || "Operational"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Event Feed */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">Live Activity Feed</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent events. Start an analysis to see real-time activity.
                </p>
              ) : (
                recentEvents.map((event, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-background/30 hover:bg-background/50 transition-colors animate-fade-in-up"
                  >
                    <AgentStatusDot
                      status={
                        event.error ? "failed" : event.percentComplete === 100 ? "completed" : "running"
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{event.agentName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {event.message ?? event.phase ?? "Processing..."}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Scheduled Jobs
            </h3>
            <div className="space-y-3">
              {schedules.map((s) => (
                <div key={s.label} className="p-3 rounded-lg bg-background/50 border border-border/50">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.cron}</p>
                  <p className="text-[10px] text-primary mt-1">Next: {s.next}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Runs</h3>
              <button
                onClick={handleClearHistory}
                disabled={clearMutation.isPending}
                className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all disabled:opacity-50"
                title="Clear all history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : !recentRuns.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No runs yet</p>
            ) : (
              <div className="space-y-2">
                {recentRuns.map((run: AgentRun) => (
                  <div key={run.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/30">
                    <AgentStatusDot
                      status={
                        run.status === "completed" ? "completed" :
                          run.status === "failed" ? "failed" :
                            run.status === "running" ? "running" : "idle"
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{run.agentName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {run.triggerType} • {new Date(run.startedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}