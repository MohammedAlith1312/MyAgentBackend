import { connectMcp, mcpClient } from "./mcpClient/index";
import { getLatestGithubToken } from "./lib/githubToken";

export async function listIssues(params: {
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
  userId?: string;
}) {
  // Pass params.owner as the targetUsername
  const token = await getLatestGithubToken(params.userId, params.owner);
  const state = params.state ?? "all";

  const url = `https://api.github.com/repos/${params.owner}/${params.repo}/issues?state=${state}`;

  console.log(`🔍 [listIssues] Fetching issues from ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "VoltAgent-Backend"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [listIssues] API Error ${response.status}:`, errorText);
    throw new Error(`GitHub API Error: ${response.statusText} - ${errorText}`);
  }

  const issues = await response.json();
  // Return in a format compatible with what tools might expect or just the raw list
  // The MCP tool previously returned a text blob, but our tool now expects structured data if we change it?
  // Actually, the tool typically returns a string to the LLM. 
  // But wait, our previous tool definition for list_issues relied on mcpClient returning what?
  // mcpClient returns CallToolResult which has `content: [{type:'text', text: '...'}]`.
  // Our tool *wrapper* in githubTool.ts might expect the result of this function to be returned directly to the agent.
  // Let's return a simplified string representation to match previous behavior, OR return the JSON 
  // and let the tool wrapper format it.

  // Checking `githubTool.ts`:
  // execute: async (input) => ... withAuthCheck(() => listIssues(...))
  // The result of this is sent to the LLM. Sending raw JSON is fine for the LLM.

  return JSON.stringify(issues, null, 2);
}


export async function getIssue(params: {
  owner: string;
  repo: string;
  issue_number: number;
  userId?: string;
}) {
  const token = await getLatestGithubToken(params.userId, params.owner);
  const url = `https://api.github.com/repos/${params.owner}/${params.repo}/issues/${params.issue_number}`;

  console.log(`🔍 [getIssue] Fetching issue from ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "VoltAgent-Backend"
    }
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const errorText = await response.text();
    throw new Error(`GitHub API Error: ${response.statusText} - ${errorText}`);
  }

  const issue = await response.json();
  return JSON.stringify(issue, null, 2);
}



export async function updateIssue(params: {
  owner: string;
  repo: string;
  issue_number: number;
  state?: "open" | "closed";
  title?: string;
  body?: string;
  userId?: string;
}) {
  const token = await getLatestGithubToken(params.userId, params.owner);

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

export async function createIssue(params: {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  userId?: string;
  assignees?: string[];
  labels?: string[];
}) {
  const token = await getLatestGithubToken(params.userId, params.owner);
  const url = `https://api.github.com/repos/${params.owner}/${params.repo}/issues`;

  console.log(`🆕 [createIssue] POST ${url}`);

  const body = {
    title: params.title,
    body: params.body,
    assignees: params.assignees,
    labels: params.labels
  };

  const response = await fetch(url, {
    method: "POST",
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
    console.error(`❌ [createIssue] API Error ${response.status}:`, errorText);
    throw new Error(`GitHub API Error: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return JSON.stringify(result, null, 2);
}

export async function createComment(params: {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
  userId?: string;
}) {
  const token = await getLatestGithubToken(params.userId, params.owner);
  const url = `https://api.github.com/repos/${params.owner}/${params.repo}/issues/${params.issue_number}/comments`;

  console.log(`💬 [createComment] POST ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "VoltAgent-Backend"
    },
    body: JSON.stringify({ body: params.body })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [createComment] API Error ${response.status}:`, errorText);
    throw new Error(`GitHub API Error: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return JSON.stringify(result, null, 2);
}

export async function listComments(params: {
  owner: string;
  repo: string;
  issue_number: number;
  userId?: string;
}) {
  const token = await getLatestGithubToken(params.userId, params.owner);
  const url = `https://api.github.com/repos/${params.owner}/${params.repo}/issues/${params.issue_number}/comments`;

  console.log(`Example: [listComments] Fetching from ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "VoltAgent-Backend"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [listComments] API Error ${response.status}:`, errorText);
    throw new Error(`GitHub API Error: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return JSON.stringify(result, null, 2);
}

export async function deleteComment(params: {
  owner: string;
  repo: string;
  comment_id: number;
  userId?: string;
}) {
  const token = await getLatestGithubToken(params.userId, params.owner);
  const url = `https://api.github.com/repos/${params.owner}/${params.repo}/issues/comments/${params.comment_id}`;

  console.log(`🗑️ [deleteComment] DELETE ${url}`);

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "VoltAgent-Backend"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [deleteComment] API Error ${response.status}:`, errorText);
    throw new Error(`GitHub API Error: ${response.statusText} - ${errorText}`);
  }

  console.log("✅ [deleteComment] Success");
  return JSON.stringify({ success: true, message: "Comment deleted" });
}