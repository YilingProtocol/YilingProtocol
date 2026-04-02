import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { Context, Next } from "hono";
import { config } from "../config.js";

/**
 * x402 Multi-Facilitator Middleware
 *
 * Graceful initialization: if facilitators are unavailable at startup,
 * paid routes pass through without payment enforcement.
 * Free routes always work regardless of facilitator status.
 */

// ─── Monad Server ───────────────────────────────────────────
const MONAD_NETWORK = "eip155:10143" as const;
const MONAD_USDC = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

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
 * Try to create x402 middleware for a facilitator.
 * Returns null if the facilitator is unavailable.
 */
function tryCreateMiddleware(
  facilitatorUrl: string,
  networks: Array<{ network: string; scheme: any }>,
  routeConfig: Record<string, any>,
): ((c: Context, next: Next) => Promise<any>) | null {
  try {
    const facilitator = new HTTPFacilitatorClient({ url: facilitatorUrl });
    const server = new x402ResourceServer(facilitator);

    for (const { network, scheme } of networks) {
      server.register(network, scheme);
    }

    return paymentMiddleware(routeConfig, server);
  } catch (err) {
    console.warn(`[x402] Failed to create middleware for ${facilitatorUrl}:`, err);
    return null;
  }
}

/**
 * Multi-facilitator payment middleware with graceful degradation.
 *
 * If facilitators are unavailable, paid routes pass through
 * (no payment enforcement) so the API still functions for testing.
 */
export function createMultiFacilitatorMiddleware(payTo: string) {
  // Build route configs
  const monadRouteConfig: Record<string, any> = {};
  const coinbaseRouteConfig: Record<string, any> = {};

  for (const [route, cfg] of Object.entries(paidRoutes)) {
    monadRouteConfig[route] = {
      accepts: [{ scheme: "exact" as const, price: cfg.price, network: MONAD_NETWORK, payTo }],
      description: cfg.description,
      mimeType: "application/json",
    };
    coinbaseRouteConfig[route] = {
      accepts: [
        { scheme: "exact" as const, price: cfg.price, network: "eip155:84532" as const, payTo },
        { scheme: "exact" as const, price: cfg.price, network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const, payTo },
      ],
      description: cfg.description,
      mimeType: "application/json",
    };
  }

  // Lazy-initialized middleware references
  let monadMiddleware: ((c: Context, next: Next) => Promise<any>) | null = null;
  let coinbaseMiddleware: ((c: Context, next: Next) => Promise<any>) | null = null;
  let initialized = false;

  async function ensureInitialized() {
    if (initialized) return;
    initialized = true;

    // Try Monad facilitator
    try {
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

      const monadFacilitator = new HTTPFacilitatorClient({ url: config.monadFacilitatorUrl });
      const monadServer = new x402ResourceServer(monadFacilitator).register(MONAD_NETWORK, monadScheme);
      monadMiddleware = paymentMiddleware(monadRouteConfig, monadServer);
      console.log("[x402] Monad facilitator initialized");
    } catch (err) {
      console.warn("[x402] Monad facilitator unavailable — paid routes on Monad will pass through");
    }

    // Try Coinbase facilitator
    try {
      const coinbaseFacilitator = new HTTPFacilitatorClient({ url: config.facilitatorUrl });
      const coinbaseServer = new x402ResourceServer(coinbaseFacilitator)
        .register("eip155:84532", new ExactEvmScheme())
        .register("solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", new ExactSvmScheme());
      coinbaseMiddleware = paymentMiddleware(coinbaseRouteConfig, coinbaseServer);
      console.log("[x402] Coinbase facilitator initialized");
    } catch (err) {
      console.warn("[x402] Coinbase facilitator unavailable — paid routes on Base/Solana will pass through");
    }

    if (!monadMiddleware && !coinbaseMiddleware) {
      console.warn("[x402] WARNING: No facilitators available. All paid routes will pass through without payment enforcement.");
    }
  }

  return async (c: Context, next: Next) => {
    const path = c.req.path;
    const route = matchRoute(path);

    // Not a paid route → pass through
    if (!route) {
      return next();
    }

    // Lazy init on first paid request
    await ensureInitialized();

    const paymentHeader = c.req.header("X-PAYMENT") || c.req.header("x-payment");

    // Determine which middleware to use
    const preferredChain = c.req.header("X-PREFERRED-CHAIN") || "";
    let useMiddleware: ((c: Context, next: Next) => Promise<any>) | null = null;

    if (paymentHeader) {
      // Has payment → route to correct facilitator
      try {
        const paymentData = JSON.parse(paymentHeader);
        const network = paymentData?.network || paymentData?.payload?.network || "";

        if (network === MONAD_NETWORK || network.includes("10143")) {
          useMiddleware = monadMiddleware;
        } else {
          useMiddleware = coinbaseMiddleware;
        }
      } catch {
        useMiddleware = monadMiddleware;
      }
    } else {
      // No payment → route based on preferred chain
      if (preferredChain.includes("84532") || preferredChain.toLowerCase().includes("base") || preferredChain.includes("solana")) {
        useMiddleware = coinbaseMiddleware;
      } else {
        useMiddleware = monadMiddleware;
      }
    }

    // If middleware is available, use it; otherwise pass through
    if (useMiddleware) {
      try {
        return await useMiddleware(c, next);
      } catch (err) {
        console.warn("[x402] Payment middleware error, passing through:", err);
        return next();
      }
    }

    // No middleware available — pass through (testnet grace mode)
    console.warn(`[x402] No facilitator for route ${path} — passing through without payment`);
    return next();
  };
}
