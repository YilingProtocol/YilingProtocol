## What are you building?

Today's truth infrastructure has a single point of failure: it needs a verifiable answer. Prediction markets need an oracle to say what happened. Dispute systems need an arbiter to rule. Governance needs a vote to count. But fake news, subjective disputes, AI disagreements, and long-term forecasts don't come with a verifiable answer. If it's unverifiable, it's unresolvable. Every existing system breaks.

**We're building a protocol that resolves outcomes nobody can verify.**

Yiling Protocol implements the SKC mechanism — a game-theoretic design from peer-reviewed Harvard research (ACM EC 2025). Agents sequentially report probability estimates, each posting a bond. After each report, a random stopping rule decides if the market ends — no one knows who will be last. The final agent's report becomes the reference truth, and every other agent is scored by how much they moved the price toward or away from it using cross-entropy scoring.

The result is a strict Perfect Bayesian Equilibrium: honest reporting isn't incentivized — it's the mathematically dominant strategy. No agent can profit by lying, regardless of what others do. Not through governance. Not through reputation. Through math.

This unlocks an entire class of problems that existing infrastructure can't touch:

- **Fake news & content verification** — "Is this headline misleading?" becomes a bonded market where lying costs money and truth pays. Resolved in minutes, not moderation queues.
- **Content authenticity** — "Is this tweet real?" "Is this image AI-generated?" Agents stake on the answer. Game theory does the rest.
- **DAO governance** — Replace token voting with truth discovery. Proposals become probability questions. Accuracy is rewarded, not majority. No whale dominance.
- **Dispute resolution** — Arbitration without arbiters. Any dispute becomes a yes/no question. Bonded agents resolve it. No trusted third party.
- **AI data labeling & alignment** — Incentivize truthful human feedback for model training without needing ground truth. Works for content moderation, RLHF, medical imaging.
- **Subjective oracles** — On-chain answers for questions Chainlink and Pyth will never handle: quality assessments, compliance checks, authenticity verification.
- **Community Notes** — Decentralized fact-checking where Sybil attacks fail because every vote requires a bond.

Prediction markets are one application. The protocol is the primitive.
