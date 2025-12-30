
import { createTool } from "@voltagent/core";
import { z } from "zod";
import {
  listComments,
  deleteComment,
  createIssue,
  updateIssue
} from "../githubservice";
import { mcpClient, connectMcp, setTargetGithubOwner } from "../mcpClient/index";
import { getBaseUrl } from "../lib/url";

// Helper to ensure MCP connection
async function ensureMcp(owner?: string) {
  if (owner) {
    setTargetGithubOwner(owner);
  }
  await connectMcp();
}

// Helper to catch auth errors and return friendly link
async function withAuthCheck(fn: () => Promise<any>) {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.message?.includes("GitHub Token missing") || err?.message?.includes("No GitHub Token found")) {
      return err.message;
    }
    throw err;
  }
}


export const githubIssuesTool = createTool({
  name: "github_issues",
  description: "Fetch GitHub issues from a repository",
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    issueNumber: z.number().optional(),
    state: z.enum(["open", "closed", "all"]).optional(),
  }),
  execute: async (input: any, options?: any) => {
    const { owner, repo, issueNumber, state } = input;
    await ensureMcp(owner);

    if (typeof issueNumber === "number") {
      // get_issue
      const result = await mcpClient.callTool({
        name: "get_issue",
        arguments: { owner, repo, issue_number: issueNumber }
      });
      return (result as any).content[0].text;
    }

    // list_issues
    const result = await mcpClient.callTool({
      name: "list_issues",
      arguments: { owner, repo, state }
    });
    return (result as any).content[0].text;
  },
});

export const githubUpdateIssueTool = createTool({
  name: "github_update_issue",
  description: "Update an existing GitHub issue (status, title, body)",
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    issueNumber: z.union([z.number(), z.string()]).optional(),
    issue_number: z.union([z.number(), z.string()]).optional(),
    state: z.enum(["open", "closed"]).optional(),
    title: z.string().optional(),
    body: z.string().optional(),
  }),
  execute: async (input: any, options?: any) => {
    const userId = options?.userId || options?.context?.userId;
    let num = input.issueNumber ?? input.issue_number;
    if (typeof num === 'string') num = parseInt(num, 10);
    if (!num) throw new Error("Missing issueNumber");

    return withAuthCheck(() => updateIssue({
      owner: input.owner,
      repo: input.repo,
      issue_number: num,
      state: input.state,
      title: input.title,
      body: input.body,
      userId
    }));
  },
});

export const githubAuthUrlTool = createTool({
  name: "github_auth_url",
  description: "Get the GitHub authorization URL for logging in. Optionally specify a username to authorize as that specific user.",
  parameters: z.object({
    username: z.string().optional().describe("The GitHub username to authorize (e.g. repo owner)"),
  }),
  execute: async (input: any, options?: any) => {
    const userId = options?.userId || options?.context?.userId;
    const targetUser = input?.username || userId;
    const baseUrl = `${getBaseUrl()}/api/auth/github`;

    if (targetUser) {
      return `${baseUrl}?userId=${encodeURIComponent(targetUser)}`;
    }
    return baseUrl;
  },
});

export const githubCreateIssueTool = createTool({
  name: "github_create_issue",
  description: "Create a new issue in a GitHub repository",
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    title: z.string(),
    body: z.string().optional(),
    assignees: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional(),
  }),
  execute: async (input: any, options?: any) => {
    const userId = options?.userId || options?.context?.userId;
    return withAuthCheck(() => createIssue({
      owner: input.owner,
      repo: input.repo,
      title: input.title,
      body: input.body,
      assignees: input.assignees,
      labels: input.labels,
      userId
    }));
  },
});

export const githubAddCommentTool = createTool({
  name: "github_add_comment",
  description: "Add a comment to an existing GitHub issue",
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    issueNumber: z.union([z.number(), z.string()]),
    issue_number: z.union([z.number(), z.string()]).optional(),
    body: z.string(),
  }),
  execute: async (input: any, options?: any) => {
    let num = input.issueNumber ?? input.issue_number;
    if (typeof num === 'string') num = parseInt(num, 10);
    if (!num) throw new Error("Missing issueNumber");

    await ensureMcp(input.owner);
    const result = await mcpClient.callTool({
      name: "add_issue_comment",
      arguments: {
        owner: input.owner,
        repo: input.repo,
        issue_number: num,
        body: input.body
      }
    });
    return (result as any).content[0].text;
  },
});

export const githubListCommentsTool = createTool({
  name: "github_list_comments",
  description: "List comments on a GitHub issue",
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    issueNumber: z.union([z.number(), z.string()]),
    issue_number: z.union([z.number(), z.string()]).optional(),
  }),
  execute: async (input: any, options?: any) => {
    const userId = options?.userId || options?.context?.userId;
    let num = input.issueNumber ?? input.issue_number;
    if (typeof num === 'string') num = parseInt(num, 10);
    if (!num) throw new Error("Missing issueNumber");

    return withAuthCheck(() => listComments({
      owner: input.owner,
      repo: input.repo,
      issue_number: num,
      userId
    }));
  },
});

export const githubDeleteCommentTool = createTool({
  name: "github_delete_comment",
  description: "Delete a comment directly by its integer ID. obtain the ID from list_comments first.",
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    commentId: z.union([z.number(), z.string()]),
    comment_id: z.union([z.number(), z.string()]).optional(),
  }),
  execute: async (input: any, options?: any) => {
    const userId = options?.userId || options?.context?.userId;
    let num = input.commentId ?? input.comment_id;
    if (typeof num === 'string') num = parseInt(num, 10);
    if (!num) throw new Error("Missing commentId");

    return withAuthCheck(() => deleteComment({
      owner: input.owner,
      repo: input.repo,
      comment_id: num,
      userId
    }));
  },
});