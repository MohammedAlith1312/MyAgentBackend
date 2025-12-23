import { connectMcp, mcpClient } from "./mcpClient/index";

export async function listIssues(params: {
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
}) {
  await connectMcp();

  return mcpClient.callTool({
    name: "list_issues",
    arguments: {
      owner: params.owner,
      repo: params.repo,
      state: params.state ?? "open",
    },
  });
}


export async function getIssue(params: {
  owner: string;
  repo: string;
  issue_number: number;
}) {
  await connectMcp();

  // GitHub MCP does NOT support get_issue
  // So we list and filter
  const result = await mcpClient.callTool({
    name: "list_issues",
    arguments: {
      owner: params.owner,
      repo: params.repo,
      state: "all",
    },
  });

  const content = result?.content;

  if (!Array.isArray(content) || !content[0]?.text) {
    return null;
  }

  const parsed = JSON.parse(content[0].text);
  const issues = parsed.issues ?? [];

  return issues.find(
    (i: any) => i.number === params.issue_number
  ) ?? null;
}
