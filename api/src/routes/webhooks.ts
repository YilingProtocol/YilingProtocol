import { Hono } from "hono";
import {
  registerWebhook,
  unregisterWebhook,
  listWebhooks,
  EVENT_TYPES,
} from "../services/webhooks.js";

const webhookRoutes = new Hono();

/**
 * POST /webhooks/register
 * Register a webhook URL to receive events
 */
webhookRoutes.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const { url, events, secret } = body;

    if (!url) return c.json({ error: "url is required" }, 400);
    if (!secret) return c.json({ error: "secret is required" }, 400);
    if (!events || !Array.isArray(events) || events.length === 0) {
      return c.json({ error: "events array is required", availableEvents: EVENT_TYPES }, 400);
    }

    const invalid = events.filter((e: string) => !EVENT_TYPES.includes(e as any));
    if (invalid.length > 0) {
      return c.json({ error: `Invalid events: ${invalid.join(", ")}`, availableEvents: EVENT_TYPES }, 400);
    }

    const registration = registerWebhook(url, events, secret);

    return c.json({
      id: registration.id,
      url: registration.url,
      events: registration.events,
      status: "registered",
    }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

/**
 * DELETE /webhooks/:id
 * Unregister a webhook
 */
webhookRoutes.delete("/:id", (c) => {
  const id = c.req.param("id")!;
  const deleted = unregisterWebhook(id);

  if (!deleted) {
    return c.json({ error: "Webhook not found" }, 404);
  }

  return c.json({ status: "unregistered", id });
});

/**
 * GET /webhooks
 * List all registered webhooks
 */
webhookRoutes.get("/", (c) => {
  const hooks = listWebhooks().map((wh) => ({
    id: wh.id,
    url: wh.url,
    events: wh.events,
    active: wh.active,
    createdAt: wh.createdAt,
  }));

  return c.json({ webhooks: hooks });
});

/**
 * GET /webhooks/events
 * List available event types
 */
webhookRoutes.get("/events", (c) => {
  return c.json({ events: EVENT_TYPES });
});

export default webhookRoutes;
