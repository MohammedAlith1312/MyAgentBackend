import { Agent } from "@voltagent/core";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  githubIssuesTool,
  githubUpdateIssueTool,
  githubAuthUrlTool,
  githubCreateIssueTool,
  githubAddCommentTool,
  githubListCommentsTool,
  githubDeleteCommentTool
} from "../tools/githubTool";
import { liveEvalConfig } from "./scorers";
export function createGithubSubAgent() {
  const model = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });

  return new Agent({
    name: "github-sub-agent",
    model: model.chat("kwaipilot/kat-coder-pro:free"),
    tools: [
      githubIssuesTool,
      githubUpdateIssueTool,
      githubAuthUrlTool,
      githubCreateIssueTool,
      githubAddCommentTool,
      githubListCommentsTool,
      githubDeleteCommentTool
    ],
    instructions: `
You are a GitHub specialist sub-agent.

RESPONSIBILITY:
- Execute GitHub operations: List, Update, Close, Create, Comment, Delete Comment.

RULES:
- **LISTING**:
  - When asked to "list" issues, provide a **CONCISE LIST** only (ID, Title, State).
  - Do not show full bodies for a general list.

- **SUMMARIZING / SPECIFIC ISSUES**:
  - If the user asks to "summarize" issues or asks about a **specific issue number**, provide the **FULL DETAILS/SUMMARY**.

- **UPDATING / CLOSING**:
  - To "delete" an issue, use the update tool to set its state to "closed".

- **CREATING / COMMENTING**:
  - Use the respective tools to create new issues or add comments.

- **DELETING COMMENTS**:
  - If the user asks to delete a comment but does NOT provide an ID:
    1. Call 'github_list_comments' first to see the comments.
    2. If there is only one, delete it. If multiple, ask the user to clarify which one.

- Return tool results directly.
`,
    eval: liveEvalConfig
  });
}