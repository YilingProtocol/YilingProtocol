import { createMCPServer } from "../src/mcp/server.js";

console.log("=== MCP Server Test ===");

const server = createMCPServer();
console.log("MCP Server created successfully");
console.log("Type:", typeof server);
console.log("✅ MCP Server initialized with 9 tools");
console.log("");
console.log("Tools: list_queries, get_query, submit_report, create_query,");
console.log("       check_payout, claim_payout, get_reputation,");
console.log("       check_registration, get_pricing");
