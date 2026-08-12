"use client";

import { FileText, Download, Loader2, Zap, ChartColumn, Building2, Search } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useState } from "react";

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const generateBoardDeck = trpc.reports.generateBoardDeck.useMutation();

  const reports = [
    {
      id: "board_deck",
      title: "Board Deck",
      description: "Comprehensive portfolio presentation with insights, charts, and recommendations",
      type: "PowerPoint / PDF",
      icon: <Search className="w-6 h-6" />,
    },
    {
      id: "monthly_flash",
      title: "Monthly Flash Report",
      description: "Quick snapshot of portfolio performance for the current month",
      type: "PDF",
      icon: <Zap className="w-6 h-6" />,
    },
    {
      id: "quarterly_review",
      title: "Quarterly Review Package",
      description: "Deep-dive analysis with trend evaluation and peer benchmarking",
      type: "PDF",
      icon: <ChartColumn className="w-6 h-6" />,
    },
    {
      id: "company_report",
      title: "Company Deep Dive Report",
      description: "Individual company analysis with P&L breakdown and insights",
      type: "PDF",
      icon: <Building2 className="w-6 h-6" />,
    },
  ];

  const handleGenerate = async (reportId: string) => {
    setGenerating(reportId);
    try {
      if (reportId === "board_deck") {
        await generateBoardDeck.mutateAsync();
      }
      // Simulated delay for other reports
      await new Promise((r) => setTimeout(r, 2000));
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports Gallery</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate professional reports and board presentations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{report.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold">{report.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Format: {report.type}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { void handleGenerate(report.id); }}
                disabled={generating === report.id}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {generating === report.id ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <FileText className="w-6 h-6" />
                )}
                {generating === report.id ? "Generating..." : "Generate"}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm hover:bg-accent transition-colors">
                <Download className="w-6 h-6" /> Download Latest
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
