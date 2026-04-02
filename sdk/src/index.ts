/**
 * Yiling Protocol SDK
 *
 * Truth discovery in 3 lines of code:
 *
 *   const yiling = new YilingClient({ apiUrl: "...", wallet: "..." });
 *   const query = await yiling.createQuery("Is this claim true?", { bondPool: 500 });
 *   const result = await yiling.waitForResult(query.queryId);
 */

export interface YilingConfig {
  apiUrl: string;
  wallet?: string; // for x402 payments
}

export interface QueryParams {
  bondPool: number;          // in USDC (e.g., 500)
  alpha?: number;            // stop probability (default 0.2 = 20%)
  k?: number;                // last k agents get flat reward (default 1)
  flatReward?: number;       // flat reward in USDC (default 0.01)
  bondAmount?: number;       // bond per report in USDC (default 0.1)
  liquidityParam?: number;   // LMSR scaling (default 1)
  initialPrice?: number;     // starting price (default 0.5)
  minReputation?: number;    // minimum agent reputation (default 0)
  reputationTag?: string;    // filter by application type
}

export interface QueryResult {
  queryId: string;
  txHash: string;
  status: string;
  fees: {
    bondPool: string;
    creationFee: string;
    totalCharged: string;
  };
}

export interface QueryStatus {
  queryId: string;
  question: string;
  currentPrice: string;
  creator: string;
  resolved: boolean;
  totalPool: string;
  reportCount: string;
  params: Record<string, string>;
  reports: Array<{
    agentId: string;
    reporter: string;
    probability: string;
    priceBefore: string;
    priceAfter: string;
    bondAmount: string;
    sourceChain: string;
    timestamp: string;
  }>;
}

export interface PayoutInfo {
  queryId: string;
  reporter: string;
  gross: string;
  rake: string;
  net: string;
  rakeRate: string;
}

export interface AgentStatus {
  address: string;
  isRegistered: boolean;
  agentId: string;
}

export interface AgentReputation {
  agentId: string;
  tag: string;
  feedbackCount: string;
  score: string;
  decimals: number;
}

const WAD = 1_000_000_000_000_000_000n;
const USDC_DECIMALS = 6;

function toWad(value: number): string {
  return (BigInt(Math.floor(value * 1e18))).toString();
}

function toUsdcUnits(value: number): string {
  return (BigInt(Math.floor(value * 10 ** USDC_DECIMALS))).toString();
}

export class YilingClient {
  private apiUrl: string;
  private wallet?: string;

  constructor(config: YilingConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, "");
    this.wallet = config.wallet;
  }

  // ========== QUERY OPERATIONS ==========

  /**
   * Create a new truth discovery query
   */
  async createQuery(question: string, params: QueryParams): Promise<QueryResult> {
    const body = {
      question,
      bondPool: toUsdcUnits(params.bondPool),
      alpha: toWad(params.alpha ?? 0.2),
      k: String(params.k ?? 1),
      flatReward: toWad(params.flatReward ?? 0.01),
      bondAmount: toWad(params.bondAmount ?? 0.1),
      liquidityParam: toWad(params.liquidityParam ?? 1),
      initialPrice: toWad(params.initialPrice ?? 0.5),
      minReputation: String(params.minReputation ?? 0),
      reputationTag: params.reputationTag ?? "",
      creator: this.wallet,
    };

    return this.post("/query/create", body);
  }

  /**
   * Get query status and details
   */
  async getQueryStatus(queryId: string): Promise<QueryStatus> {
    return this.get(`/query/${queryId}/status`);
  }

  /**
   * Wait for a query to resolve (polls every interval)
   */
  async waitForResult(queryId: string, pollIntervalMs = 5000): Promise<QueryStatus> {
    while (true) {
      const status = await this.getQueryStatus(queryId);
      if (status.resolved) return status;
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }

  /**
   * Get all active queries
   */
  async getActiveQueries(): Promise<{ activeQueries: Array<Record<string, string>> }> {
    return this.get("/queries/active");
  }

  /**
   * Force resolve a query
   */
  async resolveQuery(queryId: string): Promise<{ txHash: string; status: string }> {
    return this.post(`/query/${queryId}/resolve`, {});
  }

  // ========== REPORT OPERATIONS ==========

  /**
   * Submit a probability report for a query
   */
  async submitReport(
    queryId: string,
    probability: number,
    sourceChain?: string
  ): Promise<{ txHash: string; status: string }> {
    return this.post(`/query/${queryId}/report`, {
      probability: toWad(probability),
      reporter: this.wallet,
      sourceChain: sourceChain ?? "unknown",
    });
  }

  // ========== PAYOUT OPERATIONS ==========

  /**
   * Preview payout before claiming
   */
  async previewPayout(queryId: string, reporter?: string): Promise<PayoutInfo> {
    const addr = reporter ?? this.wallet;
    return this.get(`/query/${queryId}/payout/${addr}`);
  }

  /**
   * Claim payout after query resolution
   */
  async claimPayout(queryId: string, reporter?: string): Promise<{ txHash: string; payout: { gross: string; rake: string; net: string } }> {
    return this.post(`/query/${queryId}/claim`, {
      reporter: reporter ?? this.wallet,
    });
  }

  // ========== AGENT OPERATIONS ==========

  /**
   * Check if an address is a registered agent
   */
  async checkAgent(address: string): Promise<AgentStatus> {
    return this.get(`/agent/${address}/status`);
  }

  /**
   * Get registration instructions for a new agent.
   * Returns step-by-step guide: ERC-8004 mint → joinEcosystem → verify.
   */
  async getRegistrationSteps(agentId?: string): Promise<Record<string, any>> {
    return this.post("/agent/register", {
      wallet: this.wallet,
      agentId,
    });
  }

  /**
   * Get agent reputation
   */
  async getReputation(agentId: string, tag?: string): Promise<AgentReputation> {
    const url = tag
      ? `/agent/${agentId}/reputation?tag=${tag}`
      : `/agent/${agentId}/reputation`;
    return this.get(url);
  }

  // ========== PRICING ==========

  /**
   * Get current fee structure
   */
  async getPricing(): Promise<Record<string, any>> {
    return this.get("/query/pricing");
  }

  // ========== INTERNAL ==========

  private async get(path: string): Promise<any> {
    const res = await fetch(`${this.apiUrl}${path}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  private async post(path: string, body: any): Promise<any> {
    const res = await fetch(`${this.apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }
}
