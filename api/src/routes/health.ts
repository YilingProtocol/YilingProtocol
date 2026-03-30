import { Hono } from "hono";
import * as contract from "../services/contract.js";

const health = new Hono();

/**
 * GET /health
 * Health check + protocol stats
 */
health.get("/", async (c) => {
  try {
    const queryCount = await contract.getQueryCount();

    return c.json({
      status: "ok",
      protocol: "Yiling Protocol",
      version: "0.1.0",
      queryCount: queryCount.toString(),
    });
  } catch {
    return c.json({
      status: "degraded",
      protocol: "Yiling Protocol",
      version: "0.1.0",
      error: "Cannot reach Hub contract",
    }, 503);
  }
});

export default health;
