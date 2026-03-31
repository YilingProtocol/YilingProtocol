import { createWalletClient, http, parseAbi, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config.js";

/**
 * Payout Service — Direct ERC-20 transfers from protocol treasury
 *
 * IMPORTANT: x402 is a PULL payment protocol — it cannot push payments.
 * All outbound payouts use standard ERC-20 transfer() calls from
 * protocol-controlled treasury wallets on each supported chain.
 *
 * This is a CUSTODIAL operation — the protocol holds agent funds
 * in treasury wallets and transfers them upon claim. This is the
 * core trust assumption of Phase 1 (trusted operator model).
 *
 * Phase 2 would replace this with spoke contracts that lock bonds
 * on-chain and enforce payouts trustlessly via cross-chain messaging.
 */

const ERC20_ABI = parseAbi([
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
]);

// Treasury wallet configs per chain
// In production: use MPC, multisig, or HSM for key management
interface ChainTreasury {
  rpcUrl: string;
  usdcAddress: Address;
  chainName: string;
}

const TREASURY_CHAINS: Record<string, ChainTreasury> = {
  // EVM testnets
  "eip155:84532": {
    rpcUrl: "https://sepolia.base.org",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address, // Base Sepolia USDC
    chainName: "Base Sepolia",
  },
  "eip155:421614": {
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as Address, // Arbitrum Sepolia USDC
    chainName: "Arbitrum Sepolia",
  },
  "eip155:11155111": {
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address, // Ethereum Sepolia USDC
    chainName: "Ethereum Sepolia",
  },
  // Add more chains as needed
};

/**
 * Execute a payout to an agent on their preferred chain
 *
 * @param recipientAddress - agent's wallet address
 * @param amount - payout amount in USDC smallest units (6 decimals)
 * @param sourceChain - CAIP-2 chain ID where the agent paid bond
 * @returns transaction hash
 */
export async function executePayout(
  recipientAddress: Address,
  amount: bigint,
  sourceChain: string
): Promise<{ txHash: string; chain: string }> {
  const chainConfig = TREASURY_CHAINS[sourceChain];

  if (!chainConfig) {
    throw new Error(
      `Payout not supported on chain ${sourceChain}. ` +
      `Supported: ${Object.keys(TREASURY_CHAINS).join(", ")}`
    );
  }

  if (!config.privateKey) {
    throw new Error("Treasury private key not configured");
  }

  const account = privateKeyToAccount(config.privateKey as Hex);

  const walletClient = createWalletClient({
    account,
    chain: undefined, // dynamic chain — determined by RPC
    transport: http(chainConfig.rpcUrl),
  });

  // Convert from WAD (18 decimals) to USDC (6 decimals)
  const usdcAmount = amount / 1_000_000_000_000n; // 18 - 6 = 12 zeros

  if (usdcAmount === 0n) {
    throw new Error("Payout amount too small to convert to USDC");
  }

  // Execute ERC-20 transfer from treasury to agent
  const txHash = await walletClient.writeContract({
    address: chainConfig.usdcAddress,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [recipientAddress, usdcAmount],
    chain: undefined,
  });

  return {
    txHash,
    chain: chainConfig.chainName,
  };
}

/**
 * Check treasury balance on a specific chain
 */
export async function getTreasuryBalance(
  sourceChain: string
): Promise<{ balance: bigint; chain: string }> {
  const chainConfig = TREASURY_CHAINS[sourceChain];

  if (!chainConfig) {
    throw new Error(`Chain ${sourceChain} not configured`);
  }

  if (!config.privateKey) {
    throw new Error("Treasury private key not configured");
  }

  const account = privateKeyToAccount(config.privateKey as Hex);

  const { createPublicClient } = await import("viem");
  const publicClient = createPublicClient({
    transport: http(chainConfig.rpcUrl),
  });

  const balance = await publicClient.readContract({
    address: chainConfig.usdcAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account.address],
  });

  return {
    balance,
    chain: chainConfig.chainName,
  };
}
