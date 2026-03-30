import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { config } from "../config.js";

/**
 * x402 Payment Middleware
 *
 * IMPORTANT: x402 is a client-to-server PULL payment protocol.
 * It can only COLLECT payments (inbound), NOT push payments (outbound).
 *
 * Used for:
 *   ✅ Market creation fees (builder pays)
 *   ✅ Agent bond payments (agent pays)
 *
 * NOT used for:
 *   ❌ Agent payouts (use direct ERC-20 transfer from treasury instead)
 *
 * Supported chains (shipping SDK implementations only):
 *   - EVM: Base, Arbitrum, Optimism, Ethereum, Polygon, Avalanche
 *   - SVM: Solana
 *
 * Note: Specs exist for Aptos, Stellar, Sui, Algorand, Hedera but
 * no SDK implementations ship yet. Add when SDKs become available.
 */

// Facilitator
const coinbaseFacilitator = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator",
});

// x402 Resource Server — EVM + SVM only (shipping SDKs)
export const x402Server = new x402ResourceServer(coinbaseFacilitator)
  // EVM chains — testnet
  .register("eip155:84532", new ExactEvmScheme())     // Base Sepolia
  .register("eip155:421614", new ExactEvmScheme())    // Arbitrum Sepolia
  .register("eip155:11155420", new ExactEvmScheme())  // Optimism Sepolia
  .register("eip155:11155111", new ExactEvmScheme())  // Ethereum Sepolia
  .register("eip155:80002", new ExactEvmScheme())     // Polygon Amoy
  .register("eip155:43113", new ExactEvmScheme())     // Avalanche Fuji
  // SVM chains — testnet
  .register("solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", new ExactSvmScheme());  // Solana devnet

// Supported inbound payment networks (TESTNET)
export const allNetworks: `${string}:${string}`[] = [
  // EVM (Coinbase facilitator)
  "eip155:84532",      // Base Sepolia
  "eip155:421614",     // Arbitrum Sepolia
  "eip155:11155420",   // Optimism Sepolia
  "eip155:11155111",   // Ethereum Sepolia
  "eip155:80002",      // Polygon Amoy
  "eip155:43113",      // Avalanche Fuji
  // SVM (Coinbase facilitator)
  "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",  // Solana devnet
];

/**
 * Build x402 accepts array for a given dollar amount
 */
export function buildAccepts(price: string, payTo: string) {
  return allNetworks.map((network) => ({
    scheme: "exact" as const,
    price,
    network,
    payTo,
  }));
}
