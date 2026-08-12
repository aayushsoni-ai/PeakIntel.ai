"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { CompanyBadge, LoadingSpinner, TrendIndicator } from "../../components/shared";

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

export default function CompaniesPage() {
  const { data: companies, isLoading } = trpc.companies.list.useQuery();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Deep Dives</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a portfolio company for detailed financial analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {companies?.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.id}`}
            className="group bg-card rounded-xl border border-border p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <CompanyBadge name={company.name} industry={company.industry} />
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-5">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenue</p>
                <p className="text-lg font-bold mt-0.5">{formatCurrency(company.annualRevenue)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gross Margin</p>
                <p className="text-lg font-bold mt-0.5">
                  {(company.marginProfile * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Employees</p>
                <p className="text-sm font-medium mt-0.5">{company.employeeCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Location</p>
                <p className="text-sm font-medium mt-0.5 truncate">{company.geography}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Acquired {new Date(company.acquisitionDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
              <TrendIndicator trend={company.marginProfile > 0.5 ? "up" : company.marginProfile > 0.25 ? "stable" : "down"} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
