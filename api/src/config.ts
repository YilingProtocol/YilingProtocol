import "dotenv/config";

export const config = {
  // Hub Contract (Monad)
  rpcUrl: process.env.RPC_URL || "https://testnet-rpc.monad.xyz",
  privateKey: process.env.PRIVATE_KEY || "",

  // Contract addresses (set after deployment)
  skcEngineAddress: process.env.SKC_ENGINE_ADDRESS || "",
  queryFactoryAddress: process.env.QUERY_FACTORY_ADDRESS || "",
  agentRegistryAddress: process.env.AGENT_REGISTRY_ADDRESS || "",
  reputationManagerAddress: process.env.REPUTATION_MANAGER_ADDRESS || "",

  // x402 (inbound payments only — pull protocol, cannot push payouts)
  facilitatorUrl: process.env.X402_FACILITATOR_URL || "https://x402.org/facilitator",
  treasuryAddress: process.env.TREASURY_ADDRESS || "",

  // Server
  port: parseInt(process.env.PORT || "3001"),

  // x402 inbound payment chains (shipping SDK implementations only)
  // Note: Aptos, Stellar, Sui, Algorand, Hedera have specs but no SDK yet
  acceptedPayments: [
    // EVM
    { network: "eip155:84532", asset: "USDC" },      // Base Sepolia
    { network: "eip155:421614", asset: "USDC" },     // Arbitrum Sepolia
    { network: "eip155:11155420", asset: "USDC" },   // Optimism Sepolia
    { network: "eip155:11155111", asset: "USDC" },   // Ethereum Sepolia
    { network: "eip155:80002", asset: "USDC" },      // Polygon Amoy
    { network: "eip155:43113", asset: "USDC" },      // Avalanche Fuji
    // SVM
    { network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", asset: "USDC" },  // Solana devnet
  ],
};
