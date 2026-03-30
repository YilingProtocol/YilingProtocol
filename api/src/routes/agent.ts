import { Hono } from "hono";
import * as contract from "../services/contract.js";
import type { Address } from "viem";

const agent = new Hono();

/**
 * GET /agent/:address/status
 * Check if an address is a registered agent
 */
agent.get("/:address/status", async (c) => {
  try {
    const address = c.req.param("address") as Address;

    const [isRegistered, agentId] = await Promise.all([
      contract.isRegisteredAgent(address),
      contract.getAgentId(address),
    ]);

    return c.json({
      address,
      isRegistered,
      agentId: agentId.toString(),
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /agent/:id/reputation
 * Get an agent's reputation score
 */
agent.get("/:id/reputation", async (c) => {
  try {
    const agentId = BigInt(c.req.param("id"));
    const tag = c.req.query("tag") || "";

    const reputation = tag
      ? await contract.getAgentReputationByTag(agentId, tag)
      : await contract.getAgentReputation(agentId);

    return c.json({
      agentId: agentId.toString(),
      tag: tag || "general",
      feedbackCount: reputation.count.toString(),
      score: reputation.value.toString(),
      decimals: reputation.decimals,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default agent;
