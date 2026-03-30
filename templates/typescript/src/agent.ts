/**
 * Yiling Protocol Agent Runner
 *
 * Automatically:
 *   1. Discovers active queries
 *   2. Runs your strategy to generate predictions
 *   3. Submits reports via the Protocol API
 *   4. Claims payouts after resolution
 *
 * You only need to modify strategy.ts — this file handles everything else.
 */

import { predict } from "./strategy.js";
import { config } from "./config.js";

interface Query {
  queryId: string;
  question: string;
  currentPrice: string;
  totalPool: string;
  reportCount: string;
}

interface Report {
  agentId: string;
  reporter: string;
  probability: string;
  priceBefore: string;
  priceAfter: string;
}

async function getActiveQueries(): Promise<Query[]> {
  const res = await fetch(`${config.apiUrl}/queries/active`);
  const data = await res.json();
  return data.activeQueries;
}

async function getQueryStatus(queryId: string): Promise<any> {
  const res = await fetch(`${config.apiUrl}/query/${queryId}/status`);
  return res.json();
}

function hasAlreadyReported(reports: Report[]): boolean {
  return reports.some(
    (r) => r.reporter.toLowerCase() === config.walletAddress.toLowerCase()
  );
}

async function submitReport(queryId: string, probability: number): Promise<any> {
  const probWad = BigInt(Math.floor(probability * 1e18)).toString();

  const res = await fetch(`${config.apiUrl}/query/${queryId}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      probability: probWad,
      reporter: config.walletAddress,
      sourceChain: config.sourceChain,
    }),
  });

  return res.json();
}

function parseReports(reports: Report[]) {
  return reports.map((r) => ({
    probability: Number(r.probability) / 1e18,
    priceBefore: Number(r.priceBefore) / 1e18,
    priceAfter: Number(r.priceAfter) / 1e18,
  }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("Yiling Agent starting...");
  console.log(`  Wallet: ${config.walletAddress}`);
  console.log(`  API: ${config.apiUrl}`);
  console.log(`  Chain: ${config.sourceChain}`);
  console.log(`  Poll interval: ${config.pollIntervalMs}ms`);
  console.log();

  while (true) {
    try {
      const queries = await getActiveQueries();

      if (queries.length > 0) {
        console.log(`Found ${queries.length} active queries`);
      }

      for (const q of queries) {
        const status = await getQueryStatus(q.queryId);

        if (hasAlreadyReported(status.reports)) continue;

        const currentPrice = Number(status.currentPrice) / 1e18;
        const reports = parseReports(status.reports);

        let probability = predict(status.question, reports, currentPrice);
        probability = Math.max(0.02, Math.min(0.98, probability));

        console.log(`  Query #${q.queryId}: '${status.question}'`);
        console.log(`    Current price: ${currentPrice.toFixed(4)}`);
        console.log(`    My prediction: ${probability.toFixed(4)}`);

        const result = await submitReport(q.queryId, probability);
        console.log(`    Submitted! tx: ${result.txHash}`);
      }
    } catch (err: any) {
      if (err.cause?.code === "ECONNREFUSED") {
        console.log("Cannot reach API, retrying...");
      } else {
        console.log(`Error: ${err.message}`);
      }
    }

    await sleep(config.pollIntervalMs);
  }
}

run();
