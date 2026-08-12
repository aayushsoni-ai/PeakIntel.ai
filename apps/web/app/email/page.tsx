"use client";

import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { LoadingSpinner } from "../../components/shared";
import { Mail, Send, Clock, CheckCircle, XCircle } from "lucide-react";

export default function EmailPage() {
  const [testEmail, setTestEmail] = useState("");
  const [testTemplate, setTestTemplate] = useState("weekly_ceo");
  const { data: logs, isLoading } = trpc.email.getLogs.useQuery();
  const sendTest = trpc.email.sendTest.useMutation();

  const templates = [
    { id: "weekly_ceo", name: "Weekly CEO Email", description: "Top 3 insights per company" },
    { id: "monthly_cfo", name: "Monthly CFO Email", description: "Portfolio-wide metrics and analysis" },
    { id: "critical_alert", name: "Critical Alert", description: "Urgent insight notification" },
    { id: "agent_status", name: "Agent Status", description: "Internal agent run digest" },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Email Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage email templates, recipients, and delivery history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4">Email Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((t) => (
              <div
                key={t.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  testTemplate === t.id
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-border"
                }`}
                onClick={() => setTestTemplate(t.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-medium">{t.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Test Email Sender */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4">Send Test Email</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Template</label>
              <select
                value={testTemplate}
                onChange={(e) => setTestTemplate(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Recipient Email</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              onClick={() => {
                if (testEmail) {
                  sendTest.mutate({
                    recipientEmail: testEmail,
                    templateType: testTemplate,
                  });
                }
              }}
              disabled={sendTest.isPending || !testEmail}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sendTest.isPending ? "Sending..." : "Send Test"}
            </button>
            {sendTest.isSuccess && (
              <p className="text-xs text-emerald-400 text-center">✓ Test email queued</p>
            )}
          </div>
        </div>
      </div>

      {/* Send History */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-4">Send History</h3>
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : !logs?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No emails sent yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Template</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Recipient</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Subject</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Sent</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50">
                    <td className="px-4 py-2">{log.templateType}</td>
                    <td className="px-4 py-2 font-mono text-xs">{log.recipientEmail}</td>
                    <td className="px-4 py-2 truncate max-w-[200px]">{log.subject}</td>
                    <td className="px-4 py-2">
                      <span className={`flex items-center gap-1 text-xs ${
                        log.status === "sent" ? "text-emerald-400" :
                        log.status === "failed" ? "text-red-400" : "text-yellow-400"
                      }`}>
                        {log.status === "sent" ? <CheckCircle className="w-3 h-3" /> :
                         log.status === "failed" ? <XCircle className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
