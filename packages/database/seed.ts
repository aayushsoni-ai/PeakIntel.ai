import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

const DATA_DIR = path.resolve(__dirname, "../../data/assignment3_data");

function readCSV(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true });
}

function readJSON(filePath: string): Record<string, unknown> {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

// Company metadata enrichment with realistic data
const COMPANY_ENRICHMENT: Record<
  string,
  { employeeCount: number; acquisitionDate: string; geography: string }
> = {
  alphatech_saas: {
    employeeCount: 320,
    acquisitionDate: "2021-03-15",
    geography: "San Francisco, CA",
  },
  betamfg_inc: {
    employeeCount: 1200,
    acquisitionDate: "2020-06-01",
    geography: "Detroit, MI",
  },
  gammacare_health: {
    employeeCount: 280,
    acquisitionDate: "2022-01-10",
    geography: "Boston, MA",
  },
  deltaretail_co: {
    employeeCount: 1800,
    acquisitionDate: "2019-09-20",
    geography: "Dallas, TX",
  },
  epsilon_logistics: {
    employeeCount: 650,
    acquisitionDate: "2021-07-01",
    geography: "Memphis, TN",
  },
  zetasoftware: {
    employeeCount: 180,
    acquisitionDate: "2022-06-15",
    geography: "Austin, TX",
  },
  etaindustrial: {
    employeeCount: 950,
    acquisitionDate: "2020-11-01",
    geography: "Cleveland, OH",
  },
  thetaconsulting: {
    employeeCount: 210,
    acquisitionDate: "2021-12-01",
    geography: "New York, NY",
  },
  iotadistribution: {
    employeeCount: 1400,
    acquisitionDate: "2019-04-15",
    geography: "Chicago, IL",
  },
  kappamedia: {
    employeeCount: 420,
    acquisitionDate: "2022-03-01",
    geography: "Los Angeles, CA",
  },
};

async function seedCompanies(): Promise<void> {
  console.log("Seeding companies...");
  const metaDir = path.join(DATA_DIR, "company_metadata");
  const files = fs.readdirSync(metaDir).filter((f) => f.endsWith(".json"));

  const companies = files.map((file) => {
    const meta = readJSON(path.join(metaDir, file)) as {
      company_id: string;
      company_name: string;
      industry: string;
      sector: string;
      entry_revenue: number;
      current_revenue: number;
      margin_profile: number;
    };
    const enrichment = COMPANY_ENRICHMENT[meta.company_id];

    return {
      id: meta.company_id,
      name: meta.company_name,
      industry: meta.industry,
      sector: meta.sector,
      annualRevenue: meta.current_revenue,
      employeeCount: enrichment?.employeeCount ?? 500,
      acquisitionDate: new Date(enrichment?.acquisitionDate ?? "2021-01-01"),
      geography: enrichment?.geography ?? "United States",
      entryRevenue: meta.entry_revenue,
      marginProfile: meta.margin_profile,
    };
  });

  for (const company of companies) {
    await prisma.company.upsert({
      where: { id: company.id },
      update: company,
      create: company,
    });
  }
  console.log(`  Seeded ${companies.length} companies`);
}

async function seedPlStatements(): Promise<void> {
  console.log("Seeding P&L statements...");
  const csvPath = path.join(DATA_DIR, "pl_statements", "pl_statements.csv");
  const rows = readCSV(csvPath);

  // Process in batches of 500 for performance
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const records = batch.map((row) => ({
      companyId: row["company"],
      period: row["period"],
      accountCode: parseInt(row["account_code"], 10),
      accountName: row["account_name"],
      standardCategory: row["category"],
      amount: parseFloat(row["amount"]),
      normalizedAmount: parseFloat(row["amount"]),
      isNormalized: false,
    }));

    await prisma.plStatement.createMany({ data: records });
    inserted += records.length;
  }
  console.log(`  Seeded ${inserted} P&L statement rows`);
}

async function seedAccountMappings(): Promise<void> {
  console.log("Seeding account mappings...");
  const csvPath = path.join(
    DATA_DIR,
    "account_mappings",
    "account_mappings.csv"
  );
  const rows = readCSV(csvPath);

  const records = rows.map((row) => ({
    companyId: row["company"],
    originalAccountCode: parseInt(row["original_account_code"], 10),
    originalAccountName: row["original_account_name"],
    standardCategory: row["standard_category"],
    standardSubcategory: row["standard_subcategory"],
    confidence: 1.0,
    mappedBy: "seed",
  }));

  await prisma.accountMapping.createMany({ data: records });
  console.log(`  Seeded ${records.length} account mappings`);
}

async function seedIndustryBenchmarks(): Promise<void> {
  console.log("Seeding industry benchmarks...");
  const csvPath = path.join(
    DATA_DIR,
    "industry_benchmarks",
    "industry_benchmarks.csv"
  );
  const rows = readCSV(csvPath);

  const records = rows.map((row) => ({
    industry: row["industry"],
    metricName: row["metric"],
    p25: parseFloat(row["p25"]),
    p50: parseFloat(row["median"]),
    p75: parseFloat(row["p75"]),
    p90: parseFloat(row["p90"]),
    source: "internal",
  }));

  await prisma.industryBenchmark.createMany({ data: records });
  console.log(`  Seeded ${records.length} industry benchmarks`);
}

async function seedKpiRecords(): Promise<void> {
  console.log("Seeding KPI records...");
  const csvPath = path.join(DATA_DIR, "kpi_data", "kpi_data.csv");
  const rows = readCSV(csvPath);

  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const records = batch.map((row) => ({
      companyId: row["company"],
      period: row["period"],
      kpiName: row["kpi_name"],
      value: parseFloat(row["value"]),
      target: row["target"] ? parseFloat(row["target"]) : null,
    }));

    await prisma.kpiRecord.createMany({ data: records });
    inserted += records.length;
  }
  console.log(`  Seeded ${inserted} KPI records`);
}

async function seedPeerComps(): Promise<void> {
  console.log("Seeding peer comparables...");
  const csvPath = path.join(DATA_DIR, "peer_comps", "peer_comps.csv");
  const rows = readCSV(csvPath);

  const records = rows.map((row) => ({
    companyName: row["company_name"],
    ticker: row["ticker"],
    industry: row["industry"],
    revenue: parseFloat(row["revenue"]),
    grossMargin: parseFloat(row["gross_margin"]),
    ebitdaMargin: parseFloat(row["ebitda_margin"]),
    revenueGrowth: parseFloat(row["revenue_growth"]),
  }));

  await prisma.peerComp.createMany({ data: records });
  console.log(`  Seeded ${records.length} peer comps`);
}

async function seedEmailRecipients(): Promise<void> {
  console.log("Seeding email recipients...");
  const metaDir = path.join(DATA_DIR, "company_metadata");
  const files = fs.readdirSync(metaDir).filter((f) => f.endsWith(".json"));

  const recipients: Array<{
    companyId: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  }> = [];

  for (const file of files) {
    const meta = readJSON(path.join(metaDir, file)) as {
      company_id: string;
      company_name: string;
    };
    const companySlug = meta.company_id.replace(/_/g, "");

    // CEO
    recipients.push({
      companyId: meta.company_id,
      email: `ceo@${companySlug}.com`,
      name: `CEO of ${meta.company_name}`,
      role: "ceo",
      isActive: true,
    });

    // CFO
    recipients.push({
      companyId: meta.company_id,
      email: `cfo@${companySlug}.com`,
      name: `CFO of ${meta.company_name}`,
      role: "cfo",
      isActive: true,
    });
  }

  // PE Partner emails — associate with the first company but used portfolio-wide
  const firstCompanyId = files[0]?.replace(".json", "") ?? "alphatech_saas";
  recipients.push({
    companyId: firstCompanyId,
    email: "mpartner@pinnacleequity.com",
    name: "Managing Partner",
    role: "pe_partner",
    isActive: true,
  });
  recipients.push({
    companyId: firstCompanyId,
    email: "sassociate@pinnacleequity.com",
    name: "Senior Associate",
    role: "pe_associate",
    isActive: true,
  });

  await prisma.emailRecipient.createMany({ data: recipients });
  console.log(`  Seeded ${recipients.length} email recipients`);
}

async function main(): Promise<void> {
  console.log("=== Pinnacle AI Database Seed ===");
  console.log(`Data directory: ${DATA_DIR}`);

  if (!fs.existsSync(DATA_DIR)) {
    console.error(
      `ERROR: Data directory not found at ${DATA_DIR}. Run generate_assignment3_data.py first.`
    );
    process.exit(1);
  }

  // Clear existing data in reverse dependency order
  console.log("Clearing existing data...");
  await prisma.$transaction([
    prisma.emailRecipient.deleteMany(),
    prisma.emailLog.deleteMany(),
    prisma.kpiRecord.deleteMany(),
    prisma.computedMetric.deleteMany(),
    prisma.insight.deleteMany(),
    prisma.agentRun.deleteMany(),
    prisma.plStatement.deleteMany(),
    prisma.accountMapping.deleteMany(),
    prisma.industryBenchmark.deleteMany(),
    prisma.peerComp.deleteMany(),
    prisma.company.deleteMany(),
  ]);

  // Seed in dependency order
  await seedCompanies();
  await seedPlStatements();
  await seedAccountMappings();
  await seedIndustryBenchmarks();
  await seedKpiRecords();
  await seedPeerComps();
  await seedEmailRecipients();

  console.log("\n=== Seed Complete ===");

  // Print summary
  const counts = {
    companies: await prisma.company.count(),
    plStatements: await prisma.plStatement.count(),
    accountMappings: await prisma.accountMapping.count(),
    benchmarks: await prisma.industryBenchmark.count(),
    kpiRecords: await prisma.kpiRecord.count(),
    peerComps: await prisma.peerComp.count(),
    emailRecipients: await prisma.emailRecipient.count(),
  };
  console.log("Final counts:", counts);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
