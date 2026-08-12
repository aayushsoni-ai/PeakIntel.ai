import React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
} from "@react-email/components";

interface PortfolioMetrics {
  totalRevenue: number;
  totalEBITDA: number;
  avgEBITDAMargin: number;
  avgGrossMargin: number;
}

interface CompanyHighlight {
  name: string;
  metric: string;
  value: string;
}

interface MonthlyCFOEmailProps {
  month: string;
  portfolioMetrics: PortfolioMetrics;
  topPerformers: CompanyHighlight[];
  attentionNeeded: CompanyHighlight[];
  portfolioInsights: string[];
  dashboardUrl: string;
}

const formatCurrency = (value: number): string => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
};

const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

export const MonthlyCFOEmail: React.FC<MonthlyCFOEmailProps> = ({
  month,
  portfolioMetrics,
  topPerformers,
  attentionNeeded,
  portfolioInsights,
  dashboardUrl,
}) => (
  <Html>
    <Head />
    <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}>
      <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
        <Section
          style={{
            backgroundColor: "#0f172a",
            padding: "24px 32px",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <Text style={{ color: "#d4a853", fontSize: "12px", letterSpacing: "2px", margin: 0 }}>
            PINNACLE EQUITY GROUP
          </Text>
          <Heading style={{ color: "#ffffff", fontSize: "20px", margin: "8px 0 0 0" }}>
            Portfolio Analytics — {month}
          </Heading>
        </Section>

        <Section style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "0 0 8px 8px" }}>
          {/* Metrics Table */}
          <Heading as="h3" style={{ fontSize: "16px", color: "#111827", marginBottom: "12px" }}>
            Aggregate Metrics
          </Heading>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
            <tbody>
              {[
                ["Total Revenue", formatCurrency(portfolioMetrics.totalRevenue)],
                ["Total EBITDA", formatCurrency(portfolioMetrics.totalEBITDA)],
                ["Avg EBITDA Margin", formatPercent(portfolioMetrics.avgEBITDAMargin)],
                ["Avg Gross Margin", formatPercent(portfolioMetrics.avgGrossMargin)],
              ].map(([label, value], i) => (
                <tr key={i}>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", color: "#4b5563" }}>
                    {label}
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", fontWeight: "bold", color: "#111827", textAlign: "right" as const }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Top Performers */}
          <Heading as="h3" style={{ fontSize: "16px", color: "#059669", marginBottom: "8px" }}>
            🏆 Top Performers
          </Heading>
          {topPerformers.map((p, i) => (
            <Text key={i} style={{ fontSize: "13px", color: "#374151", margin: "4px 0" }}>
              • <strong>{p.name}</strong> — {p.metric}: {p.value}
            </Text>
          ))}

          <Hr style={{ borderColor: "#e5e7eb", margin: "16px 0" }} />

          {/* Attention Needed */}
          <Heading as="h3" style={{ fontSize: "16px", color: "#dc2626", marginBottom: "8px" }}>
            ⚠️ Attention Needed
          </Heading>
          {attentionNeeded.map((p, i) => (
            <Text key={i} style={{ fontSize: "13px", color: "#374151", margin: "4px 0" }}>
              • <strong>{p.name}</strong> — {p.metric}: {p.value}
            </Text>
          ))}

          <Hr style={{ borderColor: "#e5e7eb", margin: "16px 0" }} />

          {/* Insights */}
          <Heading as="h3" style={{ fontSize: "16px", color: "#111827", marginBottom: "8px" }}>
            Portfolio Insights
          </Heading>
          {portfolioInsights.map((insight, i) => (
            <Text key={i} style={{ fontSize: "13px", color: "#4b5563", margin: "4px 0" }}>
              • {insight}
            </Text>
          ))}

          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />

          <table style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td>
                  <Button
                    href={dashboardUrl}
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      padding: "12px 24px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      textDecoration: "none",
                    }}
                  >
                    View Dashboard
                  </Button>
                </td>
                <td>
                  <Button
                    href={`${dashboardUrl}/reports`}
                    style={{
                      backgroundColor: "#d4a853",
                      color: "#0f172a",
                      padding: "12px 24px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      textDecoration: "none",
                    }}
                  >
                    Download Board Deck
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Text style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center" as const, marginTop: "16px" }}>
          Pinnacle Intelligence Platform • Monthly Portfolio Report
        </Text>
      </Container>
    </Body>
  </Html>
);

export default MonthlyCFOEmail;
