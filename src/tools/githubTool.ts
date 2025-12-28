import { createTool } from "@voltagent/core";
import { z } from "zod";
import { listIssues, getIssue, updateIssue } from "../githubservice";



// Helper to catch auth errors and return friendly link
async function withAuthCheck(fn: () => Promise<any>) {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.message?.includes("GitHub Token missing") || err?.message?.includes("No GitHub Token found")) {
      // Return the specific error message as it now contains the correct custom link
      return err.message;
    }
    throw err;
  }
}


export const githubIssuesTool = createTool({
  // ✅ REQUIRED
  name: "github_issues",

  description: "Fetch GitHub issues from a repository",

  // ✅ MUST be ZOD (not JSON schema)
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    issueNumber: z.number().optional(),
    state: z.enum(["open", "closed", "all"]).optional(),
  }),

  // ⚠️ input is untyped unless you annotate it
  execute: async (input: any, options?: any) => {
    const { owner, repo, issueNumber, state } = input;
    // Attempt to get userId from options/context
    const userId = options?.userId || options?.context?.userId;

    if (typeof issueNumber === "number") {
      return withAuthCheck(() => getIssue({
        owner,
        repo,
        issue_number: issueNumber,
        userId
      }));
    }

    return withAuthCheck(() => listIssues({ owner, repo, state, userId }));
  },
});



export const githubUpdateIssueTool = createTool({
  name: "github_update_issue",
  description: "Update an existing GitHub issue (status, title, body)",
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    issueNumber: z.union([z.number(), z.string()]).optional(),

    issue_number: z.union([z.number(), z.string()]).optional(), // Alias for LLM convenience
    state: z.enum(["open", "closed"]).optional(),
    title: z.string().optional(),
    body: z.string().optional(),
  }),
  execute: async (input: any, options?: any) => {
    // Attempt to get userId from options/context
    const userId = options?.userId || options?.context?.userId;

    // Coalesce issueNumber and issue_number, and ensure it's a number
    let num = input.issueNumber ?? input.issue_number;
    if (typeof num === 'string') {
      num = parseInt(num, 10);
    }

    if (!num) {
      throw new Error("Missing issueNumber or issue_number");
    }

    return withAuthCheck(() => updateIssue({
      owner: input.owner,
      repo: input.repo,
      issue_number: num,
      state: input.state,
      title: input.title,
      body: input.body,
      userId: userId,
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
    const targetUser = input?.username || userId; // Prefer explicit username if provided
    const baseUrl = 'http://localhost:5000/api/auth/github';

    if (targetUser) {
      return `${baseUrl}?userId=${encodeURIComponent(targetUser)}`;
    }

    return baseUrl;
  },
});
