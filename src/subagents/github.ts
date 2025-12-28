import { Agent } from "@voltagent/core";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { githubIssuesTool, githubUpdateIssueTool, githubAuthUrlTool } from "../tools/githubTool";
import { liveEvalConfig } from "./scorers";
export function createGithubSubAgent() {
  const model = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });

  return new Agent({
    name: "github-sub-agent",
    model: model.chat("kwaipilot/kat-coder-pro:free"),
    tools: [githubIssuesTool, githubUpdateIssueTool, githubAuthUrlTool],
    instructions: `
You are a GitHub specialist sub-agent.

RESPONSIBILITY:
- Execute GitHub operations (List, Update, Close).

RULES:
- **LISTING**:
  - When asked to "list" issues, provide a **CONCISE LIST** only (ID, Title, State).
  - Do not show full bodies for a general list.

- **SUMMARIZING / SPECIFIC ISSUES**:
  - If the user asks to "summarize" issues or asks about a **specific issue number**, provide the **FULL DETAILS/SUMMARY**.

- **UPDATING**:
  - Update issues properly using the tools provided.

- Return tool results directly.
`,
    eval: liveEvalConfig
  });
}
