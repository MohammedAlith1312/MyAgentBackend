import "dotenv/config";
import { Agent } from "@voltagent/core";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { githubIssuesTool, githubUpdateIssueTool } from "./tools/githubTool";


export function createGithubSubAgent() {
  // ✅ Create OpenRouter model
  const model = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,

  });

  return new Agent({
    name: "github-sub-agent",

    // ✅ PASS THE MODEL
    model: model.chat("kwaipilot/kat-coder-pro:free"),

    tools: [githubIssuesTool, githubUpdateIssueTool],

    instructions: `
You are a GitHub specialist sub-agent.

RESPONSIBILITY:
- Execute GitHub operations (List, Update, Close).

RULES:
- Use provided tools to match user intent.
- For "close" or "reopen", use the update_issue tool.
- Return tool results directly.
- Do NOT store memory.

`,
  });
}
