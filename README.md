# Yiling Protocol

**Verifying the Unverifiable**

Oracle-free truth discovery infrastructure powered by game theory. Yiling is a general-purpose protocol for decentralized verification — prediction markets, content authenticity, governance, dispute resolution, and anything else that needs an answer to *"what's true?"* without a trusted authority.

Built on the [SKC mechanism](https://arxiv.org/abs/2306.04305) — peer-reviewed research from Harvard, published at ACM EC 2025. Honest reporting isn't encouraged; it's the mathematically dominant strategy.

`0 Oracles` · `Any EVM Chain` · `Perfect Bayesian Equilibrium`

---

## The Problem

Every decentralized system that needs truth today depends on an oracle — an external entity that says what happened. Oracles are single points of failure, susceptible to manipulation, and fundamentally **cannot handle subjective or unverifiable questions**.

*"Is this news article misleading?" "Did the team deliver on their proposal?" "Is this content authentic?"*

No data feed can answer these. Yiling can.

## How It Works

```
1. CREATE    Anyone deploys a question with parameters and funding
                              ↓
2. PREDICT   Agents submit probability estimates, each posting a bond
                              ↓
3. STOP      After each prediction, a random check (probability α) decides
             if the market ends — no one knows who will be last
                              ↓
4. SETTLE    Last prediction = reference truth. All agents scored via
             cross-entropy: moved price toward truth → rewarded,
             moved it away → bond slashed
```

**Why it works:** Every agent could be the last one. The last agent has seen all prior information and is maximally informed. Earlier agents can't manipulate the outcome — their influence decays exponentially. The result: a **strict Perfect Bayesian Equilibrium** where truth-telling dominates at every step.

## What You Can Build

Yiling is infrastructure. Prediction markets are just one product.

| Product | How It Uses Yiling |
|---|---|
| **Prediction Markets** | Self-resolving markets for any question — no oracle needed, no resolution delay |
| **Content Verification** | "Is this tweet real?" "Is this article misleading?" — bonded verification where lying costs money |
| **Community Notes** | Decentralized fact-checking with financial incentives, Sybil-resistant by design |
| **DAO Governance** | Replace token voting with probabilistic truth discovery — skin in the game, not whale dominance |
| **Dispute Resolution** | Arbitration without arbiters — frame any dispute as a question, let bonded agents resolve it |
| **AI Data Labeling** | Incentivize truthful labeling for training data without ground truth (RLHF, content moderation, medical imaging) |
| **Subjective Oracles** | On-chain oracle for questions Chainlink and Pyth can't handle — quality assessments, authenticity, compliance |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                   │
│  Prediction Markets · Community Notes · Governance   │
│  Dispute Resolution · Content Verification · ...     │
├─────────────────────────────────────────────────────┤
│                    AGENT LAYER                       │
│  AI Agents · Human Reporters · Algorithmic Traders   │
│  7 built-in strategies: Analyst, Bayesian,           │
│  Economist, Statistician, CrowdSynth, Contrarian,    │
│  Historian                                           │
├─────────────────────────────────────────────────────┤
│                  CORE PROTOCOL                       │
│  PredictionMarket.sol · MarketFactory.sol             │
│  FixedPointMath.sol (on-chain ln & cross-entropy)    │
│  SKC Mechanism · Probabilistic Stopping              │
└─────────────────────────────────────────────────────┘
```

Only the core protocol is required. Agent and application layers are optional — build your own or use the reference implementations.

## Smart Contracts

| Contract | Purpose |
|---|---|
| `PredictionMarket.sol` | Core market logic — creation, bonded predictions, random stop, cross-entropy scoring, payouts |
| `MarketFactory.sol` | Deploy isolated market instances with independent configuration |
| `FixedPointMath.sol` | On-chain `ln()` and cross-entropy math in WAD (1e18) fixed-point precision |

Contracts repo: [github.com/Muhammed5500/YilingProtocol](https://github.com/Muhammed5500/YilingProtocol)

## Quick Start

**Create a market:**

```solidity
market.createMarket(
    "Is this viral tweet authentic?",
    0.2e18,   // α: 20% stop probability per prediction
    2,        // k: last 2 agents get flat reward
    0.01e18,  // flat reward per last-k agent
    0.1e18,   // bond required per prediction
    1e18,     // liquidity parameter
    0.5e18,   // initial price: 50%
    { value: 0.7 ether }
);
```

**Submit a prediction:**

```solidity
market.predict(marketId, 0.85e18, { value: 0.1 ether });
// "I believe 85% probability this is authentic"
```

**Claim payout after resolution:**

```solidity
market.claimPayout(marketId);
```

## Live Deployments

| Network | Status |
|---|---|
| **Monad** | Live |
| Arbitrum, Optimism, Polygon | Coming soon |

## Research

Based on **"Self-Resolving Prediction Markets for Unverifiable Outcomes"** by Siddarth Srinivasan, Ezra Karger, and Yiling Chen (Harvard).

The paper proves that sequential prediction with random stopping and cross-entropy scoring creates a strict Perfect Bayesian Equilibrium — no agent can profit by lying, regardless of what others do.

- [arXiv (full paper)](https://arxiv.org/abs/2306.04305)
- [ACM Digital Library](https://dl.acm.org/doi/pdf/10.1145/3736252.3742593)

## Links

- [Documentation](https://yiling-protocol-landing.vercel.app/docs/getting-started/overview)
- [Landing Page](https://yiling-protocol-landing.vercel.app)
- [Smart Contracts](https://github.com/Muhammed5500/YilingProtocol)
- [Live Markets](https://yilingmarket.vercel.app/markets)

## License

[AGPL-3.0](LICENSE)
