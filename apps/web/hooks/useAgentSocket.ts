"use client";

import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface AgentEvent {
  agentName: string;
  runId: string;
  phase?: string;
  message?: string;
  percentComplete?: number;
  insightCount?: number;
  error?: string;
  timestamp: string;
}

interface AgentStatus {
  agentName: string;
  status: "running" | "idle" | "completed" | "failed";
  lastEvent?: AgentEvent;
}

export function useAgentSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<Map<string, AgentStatus>>(
    new Map()
  );
  const [recentEvents, setRecentEvents] = useState<AgentEvent[]>([]);
  const [latestInsights, setLatestInsights] = useState<unknown[]>([]);

  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate memory from localStorage on mount
  useEffect(() => {
    try {
      const storedEvents = localStorage.getItem("peakIntel_recentEvents");
      if (storedEvents) {
        setRecentEvents(JSON.parse(storedEvents));
      }
      const storedInsights = localStorage.getItem("peakIntel_latestInsights");
      if (storedInsights) {
        setLatestInsights(JSON.parse(storedInsights));
      }
      const storedStatuses = localStorage.getItem("peakIntel_agentStatuses");
      if (storedStatuses) {
        setAgentStatuses(new Map(JSON.parse(storedStatuses)));
      }
    } catch (e) {
      console.error("Failed to load agent memory from localStorage:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync memory to localStorage when state changes (only after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    
    try {
      localStorage.setItem("peakIntel_recentEvents", JSON.stringify(recentEvents));
      localStorage.setItem("peakIntel_latestInsights", JSON.stringify(latestInsights));
      localStorage.setItem("peakIntel_agentStatuses", JSON.stringify(Array.from(agentStatuses.entries())));
    } catch (e) {
      console.error("Failed to save agent memory to localStorage:", e);
    }
  }, [recentEvents, latestInsights, agentStatuses, isHydrated]);

  useEffect(() => {
    let wsUrl = process.env["NEXT_PUBLIC_WS_URL"] ?? "ws://localhost:3001";
    if (wsUrl.endsWith("/")) {
      wsUrl = wsUrl.slice(0, -1);
    }
    if (wsUrl && !wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
      wsUrl = `wss://${wsUrl}`;
    }
    const newSocket = io(wsUrl, {
      transports: ["polling", "websocket"],
      upgrade: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    newSocket.on("connect", () => setConnected(true));
    newSocket.on("disconnect", () => setConnected(false));

    const clearLocalState = () => {
      setRecentEvents([]);
      setLatestInsights([]);
      setAgentStatuses(new Map());
    };

    newSocket.on("agent:terminated", () => {
      clearLocalState();
    });

    newSocket.on("agent:started", (data: AgentEvent) => {
      const event = { ...data, timestamp: new Date().toISOString() };
      setRecentEvents((prev) => [event, ...prev].slice(0, 100));
      setAgentStatuses((prev) => {
        const next = new Map(prev);
        next.set(data.agentName, {
          agentName: data.agentName,
          status: "running",
          lastEvent: event,
        });
        return next;
      });
    });

    newSocket.on("agent:progress", (data: AgentEvent) => {
      const event = { ...data, timestamp: new Date().toISOString() };
      setRecentEvents((prev) => [event, ...prev].slice(0, 100));
      setAgentStatuses((prev) => {
        const next = new Map(prev);
        next.set(data.agentName, {
          agentName: data.agentName,
          status: "running",
          lastEvent: event,
        });
        return next;
      });
    });

    newSocket.on("agent:completed", (data: AgentEvent) => {
      const event = { ...data, timestamp: new Date().toISOString() };
      setRecentEvents((prev) => [event, ...prev].slice(0, 100));
      setAgentStatuses((prev) => {
        const next = new Map(prev);
        next.set(data.agentName, {
          agentName: data.agentName,
          status: "completed",
          lastEvent: event,
        });
        return next;
      });
    });

    newSocket.on("agent:failed", (data: AgentEvent) => {
      const event = { ...data, timestamp: new Date().toISOString() };
      setRecentEvents((prev) => [event, ...prev].slice(0, 100));
      setAgentStatuses((prev) => {
        const next = new Map(prev);
        next.set(data.agentName, {
          agentName: data.agentName,
          status: "failed",
          lastEvent: event,
        });
        return next;
      });
    });

    newSocket.on("insights:new", (data: { insights: unknown[] }) => {
      setLatestInsights((prev) =>
        [...(data.insights ?? []), ...prev].slice(0, 50)
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const triggerAgent = useCallback(
    (agentName: string) => {
      if (socket?.connected) {
        socket.emit("agent:trigger", { agentName });
      }
    },
    [socket]
  );

  const clearHistory = useCallback(() => {
    setRecentEvents([]);
    setLatestInsights([]);
    setAgentStatuses(new Map());
  }, []);

  return {
    connected,
    agentStatuses,
    recentEvents,
    latestInsights,
    triggerAgent,
    clearHistory,
  };
}
