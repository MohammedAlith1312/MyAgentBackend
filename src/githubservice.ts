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



export async function updateIssue(params: {
  owner: string;
  repo: string;
  issue_number: number;
  state?: "open" | "closed";
  title?: string;
  body?: string;
}) {
  const token = process.env.GITHUB_AUTH_TOKEN;
  if (!token) throw new Error("Missing GITHUB_AUTH_TOKEN");

  const url = `https://api.github.com/repos/${params.owner}/${params.repo}/issues/${params.issue_number}`;

  // Filter out undefined values
  const body: Record<string, any> = {};
  if (params.state) body.state = params.state;
  if (params.title) body.title = params.title;
  if (params.body) body.body = params.body;

  console.log(`🛠️ [updateIssue] PATCH ${url} with body:`, body);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "VoltAgent-Backend"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [updateIssue] API Error ${response.status}:`, errorText);
    throw new Error(`GitHub API Error: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log("✅ [updateIssue] Success. New State:", result.state);
  return result;
}
