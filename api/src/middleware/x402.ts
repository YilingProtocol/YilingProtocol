import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { Context, Next } from "hono";
import { config } from "../config.js";

/**
 * x402 Multi-Facilitator Middleware
 *
 * Two facilitators, two x402 servers, one middleware.
 * When a paid endpoint is hit:
 *   1. First try Monad facilitator
 *   2. If that fails, try Coinbase facilitator
 *   3. 402 response lists ALL supported networks
 */

// ─── Monad Server ───────────────────────────────────────────
const MONAD_NETWORK = "eip155:10143" as const;
const MONAD_USDC = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

const monadFacilitator = new HTTPFacilitatorClient({
  url: config.monadFacilitatorUrl,
});

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

const monadServer = new x402ResourceServer(monadFacilitator)
  .register(MONAD_NETWORK, monadScheme);

// ─── Coinbase Server ────────────────────────────────────────
const coinbaseFacilitator = new HTTPFacilitatorClient({
  url: config.facilitatorUrl,
});

const coinbaseServer = new x402ResourceServer(coinbaseFacilitator)
  .register("eip155:84532", new ExactEvmScheme())
  .register("solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", new ExactSvmScheme());

// ─── All Networks ───────────────────────────────────────────
export const allNetworks: `${string}:${string}`[] = [
  "eip155:10143",      // Monad testnet
  "eip155:84532",      // Base Sepolia
  "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",  // Solana devnet
];

// ─── Route Config ───────────────────────────────────────────
const paidRoutes: Record<string, { price: string; description: string }> = {
  "/query/create": { price: "$10.00", description: "Create a truth discovery query" },
  "/query/:id/report": { price: "$1.00", description: "Submit a report with bond" },
};

function matchRoute(path: string): string | null {
  for (const pattern of Object.keys(paidRoutes)) {
    const regex = new RegExp("^" + pattern.replace(/:id/g, "[^/]+") + "$");
    if (regex.test(path)) return pattern;
  }
  return null;
}

/**
 * Build accepts array with all networks
 */
export function buildAccepts(price: string, payTo: string) {
  return allNetworks.map((network) => ({
    scheme: "exact" as const,
    price,
    network,
    payTo,
  }));
}

/**
 * Multi-facilitator payment middleware
 *
 * For paid routes:
 *   - No payment header → return 402 with ALL networks
 *   - Payment from Monad → verify with Monad facilitator
 *   - Payment from Base/Solana → verify with Coinbase facilitator
 */
export function createMultiFacilitatorMiddleware(payTo: string) {
  // Each facilitator only knows its own networks
  const monadConfig: Record<string, any> = {};
  const coinbaseConfig: Record<string, any> = {};

  for (const [route, cfg] of Object.entries(paidRoutes)) {
    monadConfig[route] = {
      accepts: [{ scheme: "exact" as const, price: cfg.price, network: MONAD_NETWORK, payTo }],
      description: cfg.description,
      mimeType: "application/json",
    };
    coinbaseConfig[route] = {
      accepts: [
        { scheme: "exact" as const, price: cfg.price, network: "eip155:84532" as const, payTo },
        { scheme: "exact" as const, price: cfg.price, network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const, payTo },
      ],
      description: cfg.description,
      mimeType: "application/json",
    };
  }

  const monadMiddleware = paymentMiddleware(monadConfig, monadServer);
  const coinbaseMiddleware = paymentMiddleware(coinbaseConfig, coinbaseServer);

  return async (c: Context, next: Next) => {
    const path = c.req.path;
    const route = matchRoute(path);

    // Not a paid route → pass through
    if (!route) {
      return next();
    }

    const paymentHeader = c.req.header("X-PAYMENT") || c.req.header("x-payment");

    // No payment → get Monad middleware's 402, then inject Base/Solana networks
    if (!paymentHeader) {
      // Call monad middleware with a fake next that does nothing
      let monad402: Response | undefined;
      const fakeNext = async () => { /* no-op */ };

      // Clone the context to avoid conflicts
      const monadResult = await monadMiddleware(c, fakeNext);

      if (monadResult && monadResult.status === 402) {
        // Extract PAYMENT-REQUIRED header (base64 encoded JSON)
        const paymentRequiredHeader = monadResult.headers.get("PAYMENT-REQUIRED");

        if (paymentRequiredHeader) {
          try {
            // Decode base64 → JSON
            const decoded = JSON.parse(Buffer.from(paymentRequiredHeader, "base64").toString("utf-8"));

            // Add Base and Solana to accepts
            if (decoded.accepts && Array.isArray(decoded.accepts)) {
              const cfg = paidRoutes[route];
              const monadAccept = decoded.accepts[0]; // use as template

              decoded.accepts.push(
                { ...monadAccept, network: "eip155:84532" },
                { ...monadAccept, network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" },
              );
            }

            // Re-encode to base64
            const enrichedHeader = Buffer.from(JSON.stringify(decoded)).toString("base64");

            // Return new 402 with enriched header
            const headers = new Headers(monadResult.headers);
            headers.set("PAYMENT-REQUIRED", enrichedHeader);

            return new Response(monadResult.body, {
              status: 402,
              headers,
            });
          } catch {
            return monadResult;
          }
        }
      }

      return monadResult || monadMiddleware(c, next);
    }

    // Has payment → route to correct facilitator
    try {
      const paymentData = JSON.parse(paymentHeader);
      const network = paymentData?.network || paymentData?.payload?.network || "";

      if (network === MONAD_NETWORK || network.includes("10143")) {
        return monadMiddleware(c, next);
      } else {
        return coinbaseMiddleware(c, next);
      }
    } catch {
      return monadMiddleware(c, next);
    }
  };
}
