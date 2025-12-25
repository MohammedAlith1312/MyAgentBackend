import { createTool } from "@voltagent/core";
import { z } from "zod";
import { listIssues, getIssue, updateIssue } from "../githubservice";

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
  execute: async (input: any) => {
    const { owner, repo, issueNumber, state } = input;

    if (typeof issueNumber === "number") {
      return getIssue({
        owner,
        repo,
        issue_number: issueNumber,
      });
    }

    return listIssues({ owner, repo, state });
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
  execute: async (input: any) => {
    // Coalesce issueNumber and issue_number, and ensure it's a number
    let num = input.issueNumber ?? input.issue_number;
    if (typeof num === 'string') {
      num = parseInt(num, 10);
    }

    if (!num) {
      throw new Error("Missing issueNumber or issue_number");
    }

    return updateIssue({
      owner: input.owner,
      repo: input.repo,
      issue_number: num,
      state: input.state,
      title: input.title,
      body: input.body,
    });
  },
});
