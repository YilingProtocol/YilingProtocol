"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Book,
  ChevronRight,
  Code2,
  Globe,
  Layers,
  Menu,
  Moon,
  Rocket,
  Sun,
  X,
  Dices,
} from "lucide-react";

// ─── Docs Structure ──────────────────────────────────────────────────────────

const docsTree = [
  {
    title: "Getting Started",
    icon: Book,
    items: [
      { slug: "getting-started/overview", title: "Overview" },
      { slug: "getting-started/how-it-works", title: "How It Works" },
    ],
  },
  {
    title: "SKC Mechanism",
    icon: Layers,
    items: [
      { slug: "mechanism/skc", title: "SKC Mechanism" },
      { slug: "mechanism/scoring", title: "Cross-Entropy Scoring" },
      { slug: "mechanism/research", title: "Academic Research" },
    ],
  },
  {
    title: "Base Network",
    icon: Globe,
    items: [
      { slug: "base/overview", title: "Why Base" },
      { slug: "base/contracts", title: "Contract Addresses" },
    ],
  },
  {
    title: "Smart Contracts",
    icon: Code2,
    items: [
      { slug: "contracts/overview", title: "Overview" },
      { slug: "contracts/prediction-market", title: "PredictionMarket" },
      { slug: "contracts/fixed-point-math", title: "FixedPointMath" },
    ],
  },
  {
    title: "Roadmap",
    icon: Rocket,
    items: [
      { slug: "roadmap/coming-soon", title: "Coming Soon" },
    ],
  },
];

// ─── Docs Content ────────────────────────────────────────────────────────────

const docsContent: Record<string, string> = {

  // ── GETTING STARTED ──────────────────────────────────────────────────────

  "getting-started/overview": `# Overview

## What is Yiling Protocol?

Yiling Protocol is an **open, oracle-free truth discovery infrastructure** live on Base. It implements the SKC (Srinivasan-Karger-Chen) mechanism — a mathematically proven system where consensus emerges from game theory, not external oracles or human referees.

Based on [peer-reviewed research](https://arxiv.org/abs/2306.04305) from Harvard (published at ACM EC 2025), the protocol provides a general-purpose primitive for **eliciting and aggregating truthful information** in any context where ground truth is unverifiable, subjective, or long-horizon.

## The Problem

Systems that need to determine truth — prediction markets, governance, dispute resolution — all face the same bottleneck: **who decides what's true?**

- **Prediction markets** depend on external oracles (Polymarket's UMA oracle was [manipulated in 2025](https://orochi.network/blog/oracle-manipulation-in-polymarket-2025))
- **DAO governance** relies on token-weighted voting (plutocracy, low participation)
- **Dispute resolution** requires trusted arbiters (centralization, bias)

Every system that relies on an external authority to determine truth inherits that authority's limitations, biases, and attack surface.

## The Solution

Yiling Protocol removes the oracle entirely. Instead, truth emerges from **game theory and information aggregation**:

- **Self-resolving** — markets close themselves through probabilistic stopping
- **Truthful equilibrium** — honest reporting is a Perfect Bayesian Equilibrium (mathematically proven)
- **Cross-entropy scoring** — participants earn rewards proportional to accuracy
- **Bond-based** — every report requires a deposit, creating real skin in the game
- **Permissionless** — anyone can create markets or connect agents
- **Live on Base** — deployed and running with low gas fees

## Applications

| Application | What It Replaces |
|-------------|-----------------|
| Prediction Markets | External oracles (UMA, Chainlink) |
| DAO Governance | Token-weighted voting |
| Dispute Resolution | Trusted arbiters, courts |
| Data Labeling & AI | Human review pipelines |
| Subjective Oracles | Oracle committees |`,

  "getting-started/how-it-works": `# How It Works

## The Flow

\`\`\`
1. Anyone creates a market ("question + parameters")
       ↓
2. Agents report sequentially (each posts a bond)
       ↓
3. After each report: random stop check (probability α)
       ↓
4. Market resolves → last report = reference truth
       ↓
5. Cross-entropy scoring calculates payouts
       ↓
6. Agents claim: bond + reward (accurate) or bond - penalty (inaccurate)
\`\`\`

## The Key Insight

Every agent could be the last one, and the last agent's report *becomes* truth. Since the last agent has observed all previous reports plus their own private information, they represent the most informed view. This makes honest reporting the dominant strategy for *every* agent at *every* step.

## Protocol Components

| Component | Type | Description |
|-----------|------|-------------|
| Smart Contracts | **Core Protocol** | The only required piece — deployed on Base |
| AI Agents | Participants | Any LLM, algorithm, or human can participate |
| Frontend | Application | Market creation and interaction UI |

## System Architecture

\`\`\`
┌─────────────────────────────────────────────────┐
│            YOUR APPLICATION LAYER                │
│  (prediction market, governance, dispute system) │
└───────────────────┬─────────────────────────────┘
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
   ┌──────────┐ ┌────────┐ ┌──────────┐
   │   SDK    │ │  API   │ │Direct RPC│
   │ (soon)   │ │ (soon) │ │(available│
   └────┬─────┘ └───┬────┘ └────┬─────┘
        └────────────┼──────────┘
                     │
        ┌────────────▼────────────┐
        │    YILING CONTRACTS     │
        │  (Truth Discovery Core) │
        └────────────┬────────────┘
                     │
              ┌──────▼──────┐
              │    BASE     │
              └─────────────┘
\`\`\`

## Integration Patterns

**Pattern 1: Direct Contract Interaction** — Use any web3 library (ethers.js, viem, web3.py) to interact with deployed contracts on Base.

**Pattern 2: Build on Top** — Embed Yiling as a resolution primitive in your protocol. Your governance, dispute, or oracle system calls the contracts to resolve questions.

**Pattern 3: Connect Agents** — Build AI agents that participate in markets, using any LLM or algorithm.`,

  // ── SKC MECHANISM ────────────────────────────────────────────────────────

  "mechanism/skc": `# SKC Mechanism

The SKC (Srinivasan-Karger-Chen) mechanism, from [peer-reviewed Harvard research](https://arxiv.org/abs/2306.04305) published at ACM EC 2025.

## Core Innovation

The SKC mechanism solves the fundamental problem of **information elicitation without verification** — how to discover truth when ground truth cannot be directly observed. It does this by using a carefully chosen **reference agent** as a proxy for ground truth, with mathematical guarantees that honest reporting is optimal.

## How It Works

1. **Market created** with question + parameters
2. **Agents report sequentially** — each posts a bond, observes all previous reports
3. **Random stop** — after each report: \`hash % WAD < α?\`
4. **Resolution** — last report becomes reference truth (qFinal)
5. **Scoring** — cross-entropy delta determines payouts

## Why It Works

Every agent could be the last one. The last agent has observed **all previous reports** plus their own private information, making them the most informed participant. Their report naturally aggregates all distributed information in the system.

**Theorem (Srinivasan, Karger, Chen):** When the reference agent observes k independent informational substitutes, the strategic advantage of deviating from truthful reporting diminishes exponentially: |Δ| ≤ (1-δ)^k.

This constitutes a **Perfect Bayesian Equilibrium** — no agent benefits from lying, regardless of what other agents do.

## Payout Types

**Scored agents** (first n-k):
\`\`\`
payout = max(0, bond + b × [S(qFinal, priceAfter) - S(qFinal, priceBefore)])
\`\`\`

**Last k agents:**
\`\`\`
payout = bond + R
\`\`\`

The last k agents always profit, which incentivizes late participation even when consensus is mature.

## Handling Strategic Behavior

The mechanism addresses three potential manipulation vectors:

1. **Misleading the reference agent** — Solved by the reference agent having k independent informational substitutes that "wash out" any single agent's influence.

2. **Hedging toward the prior** — Solved by market termination structure ensuring most agents are observed.

3. **Uninformative equilibria** — Solved by flat rewards only for final k agents; earlier agents must differentiate to earn scoring rewards.

## Comparison to Related Approaches

| Framework | Needs Ground Truth | Elicits Beliefs | Aggregates Info | Single Task |
|-----------|-------------------|-----------------|-----------------|-------------|
| Traditional Markets | Yes (oracle) | Yes | Yes | Yes |
| Peer Prediction | No | Yes | No | Yes |
| Output Agreement | No | No | Yes | No |
| **SKC (Yiling)** | **No** | **Yes** | **Yes** | **Yes** |`,

  "mechanism/scoring": `# Cross-Entropy Scoring

## The Formula

\`\`\`
S(q, p) = q × ln(p) + (1-q) × ln(1-p)
\`\`\`

- q = final market price (reference truth)
- p = predicted probability

## Delta Payout

Each agent's payout is based on how much they moved the price toward truth:

\`\`\`
Δ = S(qFinal, priceAfter) - S(qFinal, priceBefore)
payout = max(0, bond + b × Δ)
\`\`\`

## Example: Accurate Prediction

\`\`\`
qFinal = 0.80, priceBefore = 0.50, priceAfter = 0.75

S(0.80, 0.75) = -0.507
S(0.80, 0.50) = -0.693
Δ = +0.186

bond=0.1, b=1: payout = 0.1 + 0.186 = 0.286 (+186% profit)
\`\`\`

## Example: Inaccurate Prediction

\`\`\`
qFinal = 0.80, priceBefore = 0.70, priceAfter = 0.40

Δ = -0.309
payout = max(0, 0.1 - 0.309) = 0 (bond lost)
\`\`\`

## Key Properties

- **Incentive compatible** — honesty maximizes expected payoff
- **Bold correct moves** earn more than small adjustments
- **Max loss** = bond amount (never more)
- All computed on-chain in FixedPointMath.sol`,

  "mechanism/research": `# Academic Research

Yiling Protocol is built on peer-reviewed academic research from Harvard University.

## Primary Paper

**Self-Resolving Prediction Markets for Unverifiable Outcomes**
*Siddarth Srinivasan, Ezra Karger, Yiling Chen*
Harvard University — Published at ACM Conference on Economics and Computation (EC 2025)

- [arXiv (v2, Feb 2025)](https://arxiv.org/abs/2306.04305)
- [ACM Digital Library](https://dl.acm.org/doi/pdf/10.1145/3736252.3742593)

### Abstract

The paper addresses prediction markets for outcomes that cannot be directly verified. It proposes a mechanism that pays agents the **negative cross-entropy** between their prediction and that of a carefully chosen reference agent. Markets terminate probabilistically, and the final agent — who observes all prior forecasts — serves as a proxy for ground truth.

### Key Results

**Theorem 1 (Exponential Decay):** When the reference agent observes k independent informational substitutes, the strategic adjustment term diminishes exponentially: |Δ| ≤ (1-δ)^k.

**Theorem 2 (Strict Truthfulness):** If k exceeds a threshold depending on prior beliefs, signal granularity (τ), and information quality parameters (δ, η), then truthful reporting strictly dominates any deviation.

**Theorem 3 (ε-PBE):** Without knowledge of τ, the mechanism achieves ε-Perfect Bayesian Equilibrium where the maximum gain from deviation is bounded by 𝒟_η(Δ, **y**), decreasing exponentially in k.

### Core Assumptions

1. **Common Knowledge of Rationality** — agents are risk-neutral Bayesian reasoners
2. **Common Prior** — shared prior distribution over outcomes and signals
3. **Stochastic Relevance** — each distinct signal induces a unique posterior
4. **Conditional Independence** — agents' signals are independent given the outcome
5. **(δ,η)-Informativeness** — uniform bounds on signal quality

## How Yiling Implements the Theory

| Paper Concept | Implementation |
|--------------|----------------------|
| Sequential reporting | \`predict()\` function, one per wallet |
| Random termination (α) | \`hash % WAD < alpha\` after each prediction |
| Reference agent = last reporter | Last predictor's value = \`qFinal\` |
| Cross-entropy scoring | \`FixedPointMath.crossEntropyScore()\` |
| Flat reward for last k | \`bond + flatReward\` for final k agents |
| Information aggregation | Previous predictions visible on-chain |
| Bond mechanism | \`msg.value\` attached to each prediction |

## Citation

\`\`\`bibtex
@inproceedings{srinivasan2025self,
  title={Self-Resolving Prediction Markets for Unverifiable Outcomes},
  author={Srinivasan, Siddarth and Karger, Ezra and Chen, Yiling},
  booktitle={Proceedings of the 26th ACM Conference on Economics and Computation},
  year={2025},
  publisher={ACM}
}
\`\`\``,

  // ── BASE NETWORK ─────────────────────────────────────────────────────────

  "base/overview": `# Why Base

Yiling Protocol is deployed and live on **Base** — Coinbase's Layer 2 network built on the OP Stack.

## Why We Chose Base

| Feature | Benefit |
|---------|---------|
| **Low Gas Fees** | Transactions cost fractions of a cent |
| **EVM Compatible** | Full Solidity support, no contract modifications |
| **Fast Finality** | ~2 second block times |
| **Ethereum Security** | Inherits L1 security through optimistic rollup |
| **Growing Ecosystem** | Part of the largest onchain economy |
| **Coinbase Integration** | Access to Coinbase's user base and infrastructure |

## Network Details

| Property | Mainnet | Testnet (Sepolia) |
|----------|---------|-------------------|
| Chain ID | 8453 | 84532 |
| RPC | \`https://mainnet.base.org\` | \`https://sepolia.base.org\` |
| Explorer | [basescan.org](https://basescan.org) | [sepolia.basescan.org](https://sepolia.basescan.org) |
| Gas Token | ETH | ETH |

## Live Markets

Explore active prediction markets on Base:

**[yilingmarket-onbase.vercel.app](https://yilingmarket-onbase.vercel.app/)**

Markets are fully on-chain — every prediction, resolution, and payout is recorded on Base.`,

  "base/contracts": `# Contract Addresses

Official Yiling Protocol deployment on Base.

## Base Mainnet

| Contract | Address | Explorer |
|----------|---------|----------|
| PredictionMarket | Deployed | [View on BaseScan](https://basescan.org) |
| MarketFactory | Deployed | [View on BaseScan](https://basescan.org) |

## Base Sepolia (Testnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| PredictionMarket | Deployed | [View on BaseScan](https://sepolia.basescan.org) |

## Interacting with Contracts

### Using ethers.js

\`\`\`javascript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

// Read market count
const count = await contract.getMarketCount();

// Get market info
const info = await contract.getMarketInfo(0);
\`\`\`

### Using Foundry (cast)

\`\`\`bash
export CONTRACT=YOUR_CONTRACT_ADDRESS
export RPC=https://mainnet.base.org

# Read market count
cast call $CONTRACT "getMarketCount()" --rpc-url $RPC

# Get market info
cast call $CONTRACT "getMarketInfo(uint256)" 0 --rpc-url $RPC

# Submit prediction (72%)
cast send $CONTRACT "predict(uint256,uint256)" 0 720000000000000000 \\
  --value 0.1ether --private-key $KEY --rpc-url $RPC
\`\`\`

### Using web3.py

\`\`\`python
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("https://mainnet.base.org"))
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)

count = contract.functions.getMarketCount().call()
info = contract.functions.getMarketInfo(0).call()
\`\`\``,

  // ── SMART CONTRACTS ──────────────────────────────────────────────────────

  "contracts/overview": `# Smart Contracts

The core protocol consists of three contracts deployed on Base.

## Contract Overview

| Contract | Description |
|----------|-------------|
| \`PredictionMarket.sol\` | Core SKC market logic — create markets, predict, resolve, claim |
| \`MarketFactory.sol\` | Factory for deploying isolated PredictionMarket instances |
| \`FixedPointMath.sol\` | Library for on-chain ln() and cross-entropy scoring |

## Requirements

- Solidity ^0.8.24
- Foundry (forge, cast, anvil)

## Gas Estimates (Base)

| Function | Gas | Approx Cost |
|----------|-----|-------------|
| \`createMarket()\` | ~250,000 | < $0.01 |
| \`predict()\` | ~150,000–500,000 | < $0.01 |
| \`claimPayout()\` | ~80,000 | < $0.001 |

Gas costs on Base are extremely low, making micro-bond prediction markets practical.

## Market Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Alpha (α) | 20% | Stop probability per prediction |
| K | 2 | Last k agents get flat reward |
| Flat Reward (R) | 0.01 ETH | Reward per last-k agent |
| Bond | 0.1 ETH | Deposit per prediction |
| Liquidity (b) | 1.0 ETH | LMSR scaling parameter |
| Initial Price | 0.5 | Starting market price |

## Alpha Tuning

| Alpha | Avg Predictions | Use Case |
|-------|----------------|----------|
| 10% | ~10 | Deep analysis, many agents |
| 20% | ~5 | Balanced (default) |
| 33% | ~3 | Quick resolution |
| 50% | ~2 | Very fast, binary |`,

  "contracts/prediction-market": `# PredictionMarket.sol

Core contract implementing the SKC mechanism. Deployed on Base.

## Constants

| Name | Value | Description |
|------|-------|-------------|
| WAD | 1e18 | Fixed-point precision |
| MIN_PROBABILITY | 0.01e18 | Minimum prediction (1%) |
| MAX_PROBABILITY | 0.99e18 | Maximum prediction (99%) |
| MAX_FEE_BPS | 1000 | Maximum protocol fee (10%) |

## Write Functions

### \`createMarket\`

\`\`\`solidity
function createMarket(
    string calldata question,
    uint256 alpha,          // Stop probability (WAD)
    uint256 k,              // Last k agents get flat reward
    uint256 flatReward,     // Flat reward R (wei)
    uint256 bondAmount,     // Bond per prediction (wei)
    uint256 liquidityParam, // LMSR scaling b (wei)
    uint256 initialPrice    // Starting price (WAD)
) external payable returns (uint256 marketId)
\`\`\`

Creates a new prediction market. Must send sufficient ETH to fund the market pool.

### \`predict\`

\`\`\`solidity
function predict(uint256 marketId, uint256 probability) external payable
\`\`\`

Submit a prediction with bond attached. Triggers random stop check after each call. One prediction per wallet per market.

### \`claimPayout\`

\`\`\`solidity
function claimPayout(uint256 marketId) external
\`\`\`

Claim your payout from a resolved market. Payout = bond ± scoring reward/penalty.

### \`forceResolve\`

\`\`\`solidity
function forceResolve(uint256 marketId) external
\`\`\`

Force-resolve a stale market. Owner can call anytime, anyone can call after 2 days of inactivity.

## Read Functions

| Function | Returns | Description |
|----------|---------|-------------|
| \`getMarketCount()\` | uint256 | Total markets created |
| \`getMarketInfo(id)\` | tuple | Core market data (question, price, status) |
| \`getMarketParams(id)\` | tuple | Market configuration (alpha, k, bond, etc.) |
| \`getPrediction(id, idx)\` | tuple | Specific prediction details |
| \`getPayoutAmount(id, addr)\` | uint256 | Net payout amount (post-fee) |
| \`isMarketActive(id)\` | bool | Whether market is accepting predictions |
| \`hasPredicted(id, addr)\` | bool | Whether address has already predicted |

## Events

\`\`\`solidity
event MarketCreated(uint256 indexed marketId, string question, ...)
event PredictionMade(uint256 indexed marketId, address indexed predictor, ...)
event MarketResolved(uint256 indexed marketId, uint256 finalPrice, ...)
event PayoutClaimed(uint256 indexed marketId, address indexed predictor, ...)
\`\`\``,

  "contracts/fixed-point-math": `# FixedPointMath.sol

On-chain fixed-point math library for cross-entropy scoring.

## Usage

\`\`\`solidity
import {FixedPointMath} from "yiling-protocol/src/libraries/FixedPointMath.sol";
\`\`\`

## Functions

### \`lnWad(uint256 x) → int256\`

Computes ln(x) in WAD format. Reverts if x == 0.

### \`crossEntropyScore(uint256 q, uint256 p) → int256\`

\`S(q, p) = q × ln(p) + (1-q) × ln(1-p)\`

### \`deltaPayout(uint256 qFinal, uint256 pBefore, uint256 pAfter) → int256\`

Delta score for payouts. Positive = moved toward truth. Used internally by PredictionMarket to calculate agent payouts.

## WAD Format

All values use 1e18 fixed-point representation:

\`\`\`
1.0   = 1000000000000000000  (1e18)
0.5   = 500000000000000000   (5e17)
0.01  = 10000000000000000    (1e16)
\`\`\`

## Standalone Usage

You can use FixedPointMath independently in your own contracts:

\`\`\`solidity
int256 result = FixedPointMath.lnWad(500000000000000000); // ln(0.5)
// result = -693147180559945309
\`\`\``,

  // ── ROADMAP ──────────────────────────────────────────────────────────────

  "roadmap/coming-soon": `# Coming Soon

Yiling Protocol is live on Base. Here's what's next.

## Multi-Chain Expansion

The protocol is EVM-compatible and can be deployed on any chain with minimal configuration. Planned deployments:

| Chain | Status | Timeline |
|-------|--------|----------|
| **Base** | ✅ Live | — |
| Ethereum | Planned | Q2 2026 |
| Arbitrum | Planned | Q2 2026 |
| Optimism | Planned | Q2 2026 |
| Monad | Planned | Q3 2026 |
| Polygon | Planned | Q3 2026 |
| Other EVM | Under consideration | TBD |

> Non-EVM chains (Solana, Sui, Aptos) require contract porting. The core SKC math is fully portable.

## SDK & Developer Tools

| Tool | Description | Status |
|------|-------------|--------|
| Python SDK | Client library, agent runner | In development |
| TypeScript SDK | Client library, TypeScript types | In development |
| CLI | Command-line market interaction | In development |
| REST API | HTTP endpoints for market data | Planned |
| WebSocket | Real-time market event streaming | Planned |
| Agent Framework | Multi-strategy AI agent toolkit | In development |

## Agent Strategies

Built-in AI agent personas under development:

| Strategy | Approach |
|----------|----------|
| Analyst | Data-driven, reference class forecasting |
| Bayesian | Explicit prior → likelihood → posterior |
| Economist | Macro forces, incentives, structural trends |
| Contrarian | Challenges consensus, detects groupthink |
| Ensemble | Multi-model aggregation (GPT-4, Claude, Gemini) |

## Protocol Features

- **Multi-outcome markets** — Beyond binary yes/no to categorical outcomes
- **Continuous markets** — Real-valued predictions (prices, dates, quantities)
- **Market templates** — Pre-configured market types for common use cases
- **Governance module** — Use Yiling for DAO decision-making
- **Dispute resolution** — Integrate as an arbitration layer

## Open Source

The protocol is fully open source. Contributions welcome.

- Smart contracts: [GitHub](https://github.com/Muhammed5500/YilingProcotol-landing-OnBase)
- Landing page: [GitHub](https://github.com/Muhammed5500/YilingProcotol-landing-OnBase)`,
};

// ─── Page Component ──────────────────────────────────────────────────────────

export default function DocsPage() {
  const params = useParams();
  const slug = params.slug ? (params.slug as string[]).join("/") : "getting-started/overview";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("docs-dark-mode");
    if (saved === "true") setDarkMode(true);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      localStorage.setItem("docs-dark-mode", String(!prev));
      return !prev;
    });
  };
  const content = docsContent[slug] || `# Not Found\n\nPage \`${slug}\` not found.`;

  useEffect(() => {
    if (!hydrated) {
      const initial: Record<string, boolean> = {};
      docsTree.forEach((s) => {
        const hasActivePage = s.items.some((item) => item.slug === slug);
        initial[s.title] = !hasActivePage;
      });
      setCollapsedSections(initial);
      setHydrated(true);
    } else {
      for (const section of docsTree) {
        if (section.items.some((item) => item.slug === slug)) {
          setCollapsedSections((prev) => ({ ...prev, [section.title]: false }));
        }
      }
    }
  }, [slug, hydrated]);

  const allPages = docsTree.flatMap((s) => s.items);
  const currentIdx = allPages.findIndex((p) => p.slug === slug);
  const prevPage = currentIdx > 0 ? allPages[currentIdx - 1] : null;
  const nextPage = currentIdx < allPages.length - 1 ? allPages[currentIdx + 1] : null;

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${darkMode ? "docs-dark" : ""}`} style={darkMode ? { background: "#0a0a0f", color: "#e5e5e5" } : {}}>
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
        style={darkMode ? { background: "#1a1a2e", border: "1px solid #2d2d44", color: "#e5e5e5" } : { background: "#ffffff", border: "1px solid #e5e5e5" }}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 overflow-y-auto z-40 transition-all duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={darkMode ? { background: "#111118", borderRight: "1px solid #2d2d44" } : { background: "#ffffff", borderRight: "1px solid #e5e5e5" }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange flex items-center justify-center">
                <Dices className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-[15px]" style={{ color: darkMode ? "#e5e5e5" : "#171717" }}>Yiling Docs</span>
            </Link>
            <button
              onClick={toggleDarkMode}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
              style={darkMode
                ? { background: "#1e1e2e", border: "1px solid #3d3d5c", color: "#fbbf24" }
                : { background: "#f5f5f5", border: "1px solid #e5e5e5", color: "#525252" }
              }
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <nav className="space-y-6">
            {docsTree.map((section) => {
              const isCollapsed = collapsedSections[section.title] ?? false;
              const isActiveSection = section.items.some((item) => item.slug === slug);

              return (
                <div key={section.title}>
                  <button
                    onClick={() => {
                      setCollapsedSections((prev) => ({
                        ...prev,
                        [section.title]: !prev[section.title],
                      }));
                    }}
                    className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] font-semibold mb-3 w-full text-left cursor-pointer transition-colors"
                    style={{ color: isActiveSection && isCollapsed ? "#ea580c" : darkMode ? "#6b7280" : "#a3a3a3" }}
                  >
                    <section.icon className="w-3.5 h-3.5" />
                    <span className="flex-1">{section.title}</span>
                    <ChevronRight
                      className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? "" : "rotate-90"}`}
                    />
                    {isCollapsed && isActiveSection && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange" />
                    )}
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
                    }`}
                  >
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.slug}>
                          <Link
                            href={`/docs/${item.slug}`}
                            onClick={() => setSidebarOpen(false)}
                            className={`block px-3 py-2 rounded-lg text-[14px] transition-colors ${
                              slug === item.slug
                                ? "font-semibold"
                                : ""
                            }`}
                            style={slug === item.slug
                              ? { background: darkMode ? "#ea580c15" : "#ea580c10", color: "#ea580c" }
                              : { color: darkMode ? "#9ca3af" : "#525252" }
                            }
                          >
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${darkMode ? "#2d2d44" : "#e5e5e5"}` }}>
            <Link
              href="/"
              className="flex items-center gap-2 text-[13px] transition-colors"
              style={{ color: darkMode ? "#6b7280" : "#a3a3a3" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Landing
            </Link>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 lg:pl-0">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
          <article className={`docs-content ${darkMode ? "docs-content-dark" : ""}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>

          {/* Prev/Next navigation */}
          <div className="flex items-center justify-between mt-16 pt-8" style={{ borderTop: `1px solid ${darkMode ? "#2d2d44" : "#e5e5e5"}` }}>
            {prevPage ? (
              <Link
                href={`/docs/${prevPage.slug}`}
                className="flex items-center gap-2 text-[14px] text-text-secondary hover:text-text transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {prevPage.title}
              </Link>
            ) : <div />}
            {nextPage ? (
              <Link
                href={`/docs/${nextPage.slug}`}
                className="flex items-center gap-2 text-[14px] text-text-secondary hover:text-text transition-colors"
              >
                {nextPage.title}
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : <div />}
          </div>
        </div>
      </main>
    </div>
  );
}
