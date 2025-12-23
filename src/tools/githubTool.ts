import { createTool } from "@voltagent/core";
import { z } from "zod";
import { listIssues, getIssue } from "../githubservice";

export const githubIssuesTool = createTool({
  // ✅ REQUIRED
  name: "github_issues",

  description: "Fetch GitHub issues from a repository",

  // ✅ MUST be ZOD (not JSON schema)
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    issueNumber: z.number().optional(),
  }),

  // ⚠️ input is untyped unless you annotate it
  execute: async (input: any) => {
    const { owner, repo, issueNumber } = input;

    if (typeof issueNumber === "number") {
      return getIssue({
        owner,
        repo,
        issue_number: issueNumber,
      });
    }

    return listIssues({ owner, repo });
  },
});
