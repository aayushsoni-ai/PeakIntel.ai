import React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from "@react-email/components";

interface AgentSummary {
  agentName: string;
  status: string;
  insightsGenerated: number;
  duration: string;
}

interface AgentStatusEmailProps {
  runType: string;
  startedAt: string;
  completedAt: string;
  agentSummaries: AgentSummary[];
  insightCounts: { critical: number; high: number; medium: number; low: number };
}

export const AgentStatusEmail: React.FC<AgentStatusEmailProps> = ({
  runType,
  startedAt,
  completedAt,
  agentSummaries,
  insightCounts,
}) => (
  <Html>
    <Head />
    <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}>
      <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
        <Section style={{ backgroundColor: "#0f172a", padding: "24px 32px", borderRadius: "8px 8px 0 0" }}>
          <Text style={{ color: "#d4a853", fontSize: "12px", letterSpacing: "2px", margin: 0 }}>
            PINNACLE AI — INTERNAL
          </Text>
          <Heading style={{ color: "#ffffff", fontSize: "20px", margin: "8px 0 0 0" }}>
            Agent Run Complete: {runType}
          </Heading>
        </Section>

        <Section style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "0 0 8px 8px" }}>
          <table style={{ width: "100%", marginBottom: "20px" }}>
            <tbody>
              <tr>
                <td style={{ fontSize: "13px", color: "#6b7280" }}>Started</td>
                <td style={{ fontSize: "13px", fontWeight: "bold", textAlign: "right" as const }}>{startedAt}</td>
              </tr>
              <tr>
                <td style={{ fontSize: "13px", color: "#6b7280" }}>Completed</td>
                <td style={{ fontSize: "13px", fontWeight: "bold", textAlign: "right" as const }}>{completedAt}</td>
              </tr>
            </tbody>
          </table>

          <Heading as="h3" style={{ fontSize: "14px", color: "#111827" }}>Insight Counts</Heading>
          <Text style={{ fontSize: "13px", color: "#374151" }}>
            🔴 Critical: {insightCounts.critical} | 🟠 High: {insightCounts.high} |
            🟡 Medium: {insightCounts.medium} | 🔵 Low: {insightCounts.low}
          </Text>

          <Hr style={{ borderColor: "#e5e7eb", margin: "16px 0" }} />

          <Heading as="h3" style={{ fontSize: "14px", color: "#111827" }}>Agent Details</Heading>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "8px", textAlign: "left" as const, fontSize: "12px", color: "#6b7280", borderBottom: "2px solid #e5e7eb" }}>Agent</th>
                <th style={{ padding: "8px", textAlign: "center" as const, fontSize: "12px", color: "#6b7280", borderBottom: "2px solid #e5e7eb" }}>Status</th>
                <th style={{ padding: "8px", textAlign: "center" as const, fontSize: "12px", color: "#6b7280", borderBottom: "2px solid #e5e7eb" }}>Insights</th>
                <th style={{ padding: "8px", textAlign: "right" as const, fontSize: "12px", color: "#6b7280", borderBottom: "2px solid #e5e7eb" }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {agentSummaries.map((agent, i) => (
                <tr key={i}>
                  <td style={{ padding: "8px", fontSize: "13px", borderBottom: "1px solid #e5e7eb" }}>{agent.agentName}</td>
                  <td style={{ padding: "8px", fontSize: "13px", textAlign: "center" as const, borderBottom: "1px solid #e5e7eb" }}>
                    {agent.status === "completed" ? "✅" : "❌"} {agent.status}
                  </td>
                  <td style={{ padding: "8px", fontSize: "13px", textAlign: "center" as const, borderBottom: "1px solid #e5e7eb" }}>{agent.insightsGenerated}</td>
                  <td style={{ padding: "8px", fontSize: "13px", textAlign: "right" as const, borderBottom: "1px solid #e5e7eb" }}>{agent.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Text style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center" as const, marginTop: "16px" }}>
          Pinnacle Intelligence Platform • Internal Agent Status
        </Text>
      </Container>
    </Body>
  </Html>
);

export default AgentStatusEmail;
