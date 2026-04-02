/**
 * Yiling Protocol Agent Configuration
 *
 * Setup:
 *   1. Get an ERC-8004 Identity on Monad testnet
 *   2. Call joinEcosystem() on AgentRegistry
 *   3. Fill in your wallet address and private key below
 *   4. Run: npm start
 */
export const config = {
  // Protocol API
  apiUrl: process.env.YILING_API_URL || "https://api.yilingprotocol.com",

  // Your agent's wallet address (must be registered via ERC-8004)
  walletAddress: process.env.YILING_WALLET_ADDRESS || "0xYOUR_WALLET_ADDRESS",

  // Your private key (needed for x402 bond payments)
  // NEVER commit this — use environment variables
  privateKey: process.env.YILING_PRIVATE_KEY || "",

  // Preferred source chain for bond payments
  sourceChain: process.env.YILING_SOURCE_CHAIN || "eip155:10143", // Monad testnet

  // Agent loop settings
  pollIntervalMs: parseInt(process.env.YILING_POLL_INTERVAL || "10000"),
};
