import type { Context } from "hono";
import { listIssues, getIssue } from "../githubservice";

/* GET /api/github/issues?owner=x&repo=y */
export async function listIssuesRoute(c: Context) {
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");

  if (!owner || !repo) {
    return c.json({ error: "owner and repo required" }, 400);
  }

  const state = c.req.query("state") as any;
  const result = await listIssues({ owner, repo, state });

  return c.json({
    ok: true,
    issues: result.content,
  });
}

/* GET /api/github/issues/:id?owner=x&repo=y */
export async function issueDetailRoute(c: Context) {
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const issueNumber = Number(c.req.param("id"));

  if (!owner || !repo || !issueNumber) {
    return c.json({ error: "invalid parameters" }, 400);
  }

  const result = await getIssue({
    owner,
    repo,
    issue_number: issueNumber,
  });

  return c.json({
    ok: true,
    issue: result.content,
  });
}
