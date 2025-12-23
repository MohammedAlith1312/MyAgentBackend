import "dotenv/config";
import { Agent } from "@voltagent/core";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { githubIssuesTool } from "./tools";


export function createGithubSubAgent() {
  // ✅ Create OpenRouter model
  const model = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,

  });

  return new Agent({
    name: "github-sub-agent",

    // ✅ PASS THE MODEL
    model: model.chat("nvidia/nemotron-3-nano-30b-a3b:free"),

    tools: [githubIssuesTool],

    instructions: `
You are a GitHub specialist sub-agent.

RESPONSIBILITY:
- Fetch GitHub issue data only.

RULES:
- Use GitHub APIs / MCP tools to retrieve issues.
- Return RAW issue data only.
- Do NOT summarize.
- Do NOT interpret.
- Do NOT format for end users.
- Do NOT add explanations.
- Do NOT store memory.

`,
  });
}
