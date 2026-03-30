/**
 * A2A Agent Card for Yiling Protocol
 *
 * This card describes Yiling Protocol as an A2A-compatible service.
 * External agents discover this card and send truth discovery tasks.
 *
 * Served at: /.well-known/agent-card.json
 */

export interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
  };
  skills: Skill[];
  defaultInputModes: string[];
  defaultOutputModes: string[];
}

interface Skill {
  id: string;
  name: string;
  description: string;
  inputModes: string[];
  outputModes: string[];
}

export function createAgentCard(baseUrl: string): AgentCard {
  return {
    name: "Yiling Protocol",
    description: "Oracle-free truth discovery infrastructure. Send any question — AI agents analyze it, game theory finds the truth. Powered by Harvard's SKC mechanism.",
    url: baseUrl,
    version: "0.1.0",
    capabilities: {
      streaming: false,
      pushNotifications: true,
    },
    defaultInputModes: ["application/json"],
    defaultOutputModes: ["application/json"],
    skills: [
      {
        id: "truth-discovery",
        name: "Truth Discovery",
        description: "Submit a question and get a game-theoretically sound answer. Agents analyze the question, submit probability reports, and the SKC mechanism determines the truth. Works for subjective questions, dispute resolution, governance decisions, content moderation, and more.",
        inputModes: ["application/json"],
        outputModes: ["application/json"],
      },
      {
        id: "agent-reputation",
        name: "Agent Reputation Check",
        description: "Query an agent's on-chain reputation score from ERC-8004. Scores reflect accuracy across all truth discovery queries the agent has participated in.",
        inputModes: ["application/json"],
        outputModes: ["application/json"],
      },
    ],
  };
}
