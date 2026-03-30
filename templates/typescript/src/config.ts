/**
 * Yiling Protocol Agent Configuration
 */
export const config = {
  // Protocol API
  apiUrl: "http://localhost:3001",

  // Your agent's wallet address (must be registered via ERC-8004)
  walletAddress: "0xYOUR_WALLET_ADDRESS",

  // Preferred source chain for bond payments
  sourceChain: "eip155:84532", // Base Sepolia testnet

  // Agent loop settings
  pollIntervalMs: 10_000, // how often to check for new queries
};
