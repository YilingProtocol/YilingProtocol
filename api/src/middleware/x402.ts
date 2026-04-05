import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { Context, Next } from "hono";
import { config } from "../config.js";

type PaymentEnv = {
  Variables: {
    paymentChain: string;
  };
};

/**
 * x402 Multi-Facilitator Middleware
 *
 * Dynamic pricing: reads request body to determine actual cost.
 * - /query/create: bondPool + 15% fee (from body) — accepts ALL chains
 * - /query/:id/report: bondAmount (from on-chain) — accepts ONLY query's chain
 */

const MONAD_NETWORK = "eip155:10143" as const;
const MONAD_USDC = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

const MONAD_FACILITATOR_URL = config.monadFacilitatorUrl || "https://x402-facilitator.molandak.org";
const COINBASE_FACILITATOR_URL = "https://www.x402.org/facilitator";

/** All supported networks for inbound payments */
export const allNetworks: `${string}:${string}`[] = [
  "eip155:10143",   // Monad Testnet
  "eip155:84532",   // Base Sepolia
  "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", // Solana Devnet
];

/** Map CAIP-2 network to facilitator type */
function getFacilitatorType(network: string): "monad" | "coinbase" {
  if (network === MONAD_NETWORK || network.includes("10143")) return "monad";
  return "coinbase";
}

// ─── Dynamic Price Functions ──────────────────────────────

/** Calculate x402 price for query creation from request body */
function createQueryPrice(context: any): string {
  try {
    const body = context.adapter.getBody?.();
    if (body?.bondPool) {
      const bondPoolUsdc = Number(BigInt(body.bondPool)) / 1e18;
      const withFee = bondPoolUsdc * 1.15; // +15% creation fee
      const price = Math.max(0.01, withFee);
      return `$${price.toFixed(6)}`;
    }
  } catch {}
  return "$1.00";
}

/** Calculate x402 price for report submission from query's bondAmount */
async function reportPrice(context: any): Promise<string> {
  try {
    const path = context.adapter.getPath?.() || "";
    const match = path.match(/\/query\/(\d+)\/report/);
    if (match) {
      const queryId = match[1];
      const { getQueryParams } = await import("../services/contract.js");
      const params = await getQueryParams(BigInt(queryId));
      const bondUsdc = Number(params.bondAmount) / 1e18;
      const price = Math.max(0.01, bondUsdc);
      return `$${price.toFixed(6)}`;
    }
  } catch {}
  return "$1.00";
}

function matchRoute(path: string): string | null {
  if (path === "/query/create") return "/query/create";
  if (/^\/query\/[^/]+\/report$/.test(path)) return "/query/:id/report";
  return null;
}

/**
 * Build accepts array for x402 402 response.
 * For query creation: all networks (builder picks chain).
 * For reports: only the query's chain (enforced by ChainMismatch).
 */
export function buildAccepts(price: string, payTo: string, restrictToNetwork?: string) {
  const networks = restrictToNetwork ? [restrictToNetwork] : allNetworks;
  return (networks as `${string}:${string}`[]).map((network) => ({
    scheme: "exact" as const,
    price,
    network,
    payTo,
  }));
}

// ─── Middleware State ───────────────────────────────────────
let monadMiddleware: ((c: Context, next: Next) => Promise<any>) | null = null;
let coinbaseMiddleware: ((c: Context, next: Next) => Promise<any>) | null = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

async function initializeMiddleware(payTo: string) {
  // ── Route configs ──────────────────────────────────────

  // Query creation: accepts ALL networks (builder picks chain)
  const monadCreateConfig: Record<string, any> = {
    "/query/create": {
      accepts: [{
        scheme: "exact" as const,
        price: createQueryPrice,
        network: MONAD_NETWORK,
        payTo,
      }],
      description: "Create a truth discovery query",
      mimeType: "application/json",
    },
    "/query/:id/report": {
      accepts: [{
        scheme: "exact" as const,
        price: reportPrice,
        network: MONAD_NETWORK,
        payTo,
      }],
      description: "Submit a report with bond",
      mimeType: "application/json",
    },
  };

  const coinbaseCreateConfig: Record<string, any> = {
    "/query/create": {
      accepts: [
        { scheme: "exact" as const, price: createQueryPrice, network: "eip155:84532" as const, payTo },
        { scheme: "exact" as const, price: createQueryPrice, network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const, payTo },
      ],
      description: "Create a truth discovery query",
      mimeType: "application/json",
    },
    "/query/:id/report": {
      accepts: [
        { scheme: "exact" as const, price: reportPrice, network: "eip155:84532" as const, payTo },
        { scheme: "exact" as const, price: reportPrice, network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const, payTo },
      ],
      description: "Submit a report with bond",
      mimeType: "application/json",
    },
  };

  // ── Monad Facilitator ────────────────────────────────────
  try {
    const monadFacilitator = new HTTPFacilitatorClient({ url: MONAD_FACILITATOR_URL });
    const supported = await monadFacilitator.getSupported();
    console.log(`[x402] Monad facilitator connected (${supported.kinds.length} kinds)`);

    const monadScheme = new ExactEvmScheme();
    monadScheme.registerMoneyParser(async (amount: number, network: string) => {
      if (network === MONAD_NETWORK) {
        return {
          amount: Math.floor(amount * 1_000_000).toString(),
          asset: MONAD_USDC,
          extra: { name: "USDC", version: "2" },
        };
      }
      return null;
    });

    const monadServer = new x402ResourceServer(monadFacilitator).register(MONAD_NETWORK, monadScheme);
    monadMiddleware = paymentMiddleware(monadCreateConfig, monadServer);
    console.log("[x402] Monad middleware ready (dynamic pricing)");
  } catch (err: any) {
    console.warn(`[x402] Monad facilitator failed: ${err.message}`);
  }

  // ── Coinbase Facilitator ─────────────────────────────────
  try {
    const coinbaseFacilitator = new HTTPFacilitatorClient({ url: COINBASE_FACILITATOR_URL });
    const supported = await coinbaseFacilitator.getSupported();
    console.log(`[x402] Coinbase facilitator connected (${supported.kinds.length} kinds)`);

    const coinbaseServer = new x402ResourceServer(coinbaseFacilitator)
      .register("eip155:84532", new ExactEvmScheme())
      .register("solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", new ExactSvmScheme());
    coinbaseMiddleware = paymentMiddleware(coinbaseCreateConfig, coinbaseServer);
    console.log("[x402] Coinbase middleware ready (dynamic pricing)");
  } catch (err: any) {
    console.warn(`[x402] Coinbase facilitator failed: ${err.message}`);
  }

  if (!monadMiddleware && !coinbaseMiddleware) {
    console.warn("[x402] WARNING: No facilitators available — paid routes will pass through");
  }
}

/**
 * Multi-facilitator payment middleware.
 * Lazy-initializes on first paid request. Graceful fallback if unavailable.
 */
export function createMultiFacilitatorMiddleware(payTo: string) {
  return async (c: Context<PaymentEnv>, next: Next) => {
    const path = c.req.path;
    const route = matchRoute(path);

    // Not a paid route → pass through
    if (!route) {
      return next();
    }

    // Lazy init (once)
    if (!initialized) {
      if (!initPromise) {
        initPromise = initializeMiddleware(payTo).then(() => { initialized = true; });
      }
      await initPromise;
    }

    const paymentHeader = c.req.header("X-PAYMENT") || c.req.header("x-payment");
    const preferredChain = c.req.header("X-PREFERRED-CHAIN") || "";

    // Determine which middleware to use
    let useMiddleware: ((c: Context, next: Next) => Promise<any>) | null = null;
    let detectedChain = "";

    if (paymentHeader) {
      try {
        const paymentData = JSON.parse(paymentHeader);
        detectedChain = paymentData?.accepted?.network || paymentData?.network || paymentData?.payload?.network || "";
        useMiddleware = getFacilitatorType(detectedChain) === "monad"
          ? monadMiddleware
          : coinbaseMiddleware;
      } catch {
        try {
          const decoded = JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf-8"));
          detectedChain = decoded?.accepted?.network || "";
          useMiddleware = getFacilitatorType(detectedChain) === "monad"
            ? monadMiddleware
            : coinbaseMiddleware;
        } catch {
          useMiddleware = monadMiddleware;
          detectedChain = MONAD_NETWORK;
        }
      }
    } else {
      // No payment header — initial 402 request.
      // Use preferred chain hint or default to Monad.
      if (preferredChain && getFacilitatorType(preferredChain) === "coinbase") {
        useMiddleware = coinbaseMiddleware;
      } else {
        useMiddleware = monadMiddleware;
      }
    }

    // Inject verified payment chain into context for downstream handlers
    if (detectedChain) {
      c.set("paymentChain", detectedChain);
    }

    // Use middleware if available, otherwise pass through
    if (useMiddleware) {
      try {
        return await useMiddleware(c, next);
      } catch (err: any) {
        console.warn(`[x402] Middleware error on ${path}: ${err.message}`);
        return next();
      }
    }

    console.warn(`[x402] No facilitator for ${path} — passing through`);
    return next();
  };
}
