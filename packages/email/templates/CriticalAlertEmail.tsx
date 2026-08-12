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

interface InsightData {
  title: string;
  severity: string;
  summary: string;
  recommendations: string[];
  supportingData: Record<string, string | number>;
}

interface CriticalAlertEmailProps {
  insight: InsightData;
  companyName: string;
  detectedAt: string;
  dashboardUrl: string;
}

export const CriticalAlertEmail: React.FC<CriticalAlertEmailProps> = ({
  insight,
  companyName,
  detectedAt,
  dashboardUrl,
}) => (
  <Html>
    <Head />
    <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" }}>
      <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
        {/* Alert Banner */}
        <Section
          style={{
            backgroundColor: "#dc2626",
            padding: "16px 32px",
            borderRadius: "8px 8px 0 0",
            textAlign: "center" as const,
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: "18px", fontWeight: "bold", margin: 0 }}>
            🚨 CRITICAL ALERT
          </Text>
        </Section>

        {/* Header */}
        <Section style={{ backgroundColor: "#0f172a", padding: "20px 32px" }}>
          <Text style={{ color: "#d4a853", fontSize: "12px", letterSpacing: "2px", margin: 0 }}>
            PINNACLE EQUITY GROUP
          </Text>
          <Heading style={{ color: "#ffffff", fontSize: "18px", margin: "8px 0 0 0" }}>
            {insight.title}
          </Heading>
          <Text style={{ color: "#94a3b8", fontSize: "13px", margin: "4px 0 0 0" }}>
            {companyName} • Detected {detectedAt}
          </Text>
        </Section>

        {/* Body */}
        <Section style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "0 0 8px 8px" }}>
          {/* Severity Badge */}
          <Text style={{
            display: "inline-block",
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "bold",
            marginBottom: "16px",
          }}>
            Severity: {insight.severity.toUpperCase()}
          </Text>

          {/* Summary */}
          <Text style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6" }}>
            {insight.summary}
          </Text>

          {/* Supporting Data */}
          {Object.keys(insight.supportingData).length > 0 && (
            <>
              <Heading as="h3" style={{ fontSize: "14px", color: "#111827", marginTop: "20px" }}>
                Supporting Data
              </Heading>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {Object.entries(insight.supportingData).map(([key, value], i) => (
                    <tr key={i}>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontSize: "13px", color: "#6b7280" }}>
                        {key}
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontSize: "13px", fontWeight: "bold", color: "#111827", textAlign: "right" as const }}>
                        {String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Recommendations */}
          <Heading as="h3" style={{ fontSize: "14px", color: "#111827", marginTop: "20px" }}>
            Recommended Actions
          </Heading>
          {insight.recommendations.map((rec, i) => (
            <Text key={i} style={{ fontSize: "13px", color: "#374151", margin: "6px 0", paddingLeft: "12px", borderLeft: "3px solid #d4a853" }}>
              {i + 1}. {rec}
            </Text>
          ))}

          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />

          <Button
            href={dashboardUrl}
            style={{
              backgroundColor: "#dc2626",
              color: "#ffffff",
              padding: "14px 28px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "bold",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Take Immediate Action →
          </Button>
        </Section>

        <Text style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center" as const, marginTop: "16px" }}>
          Pinnacle Intelligence Platform • Critical Alert
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CriticalAlertEmail;
