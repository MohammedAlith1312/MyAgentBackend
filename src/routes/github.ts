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

  const userId = c.req.query("userId");

  try {
    const result = await listIssues({ owner, repo, state, userId });
    return c.json({
      ok: true,
      issues: JSON.parse(result),
    });
  } catch (e: any) {
    if (e.message.includes("GitHub Token missing") || e.message.includes("Authorization Required")) {
      // Construct the Auth Link dynamically
      const port = process.env.PORT || 5000;
      const appUrl = process.env.BASE_URL || `http://localhost:${port}`;
      const authUrl = `${appUrl}/api/auth/github?userId=${encodeURIComponent(userId || "user")}`;

      return c.json({
        error: "Authorization Required",
        authUrl
      }, 401);
    }
    return c.json({ error: e.message }, 500);
  }
}

/* GET /api/github/issues/:id?owner=x&repo=y */
export async function issueDetailRoute(c: Context) {
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const issueNumber = Number(c.req.param("id"));

  if (!owner || !repo || !issueNumber) {
    return c.json({ error: "invalid parameters" }, 400);
  }

  const userId = c.req.query("userId");

  try {
    const result = await getIssue({
      owner,
      repo,
      issue_number: issueNumber,
      userId
    });

    return c.json({
      ok: true,
      issue: result ? JSON.parse(result) : null,
    });
  } catch (e: any) {
    if (e.message.includes("GitHub Token missing") || e.message.includes("Authorization Required")) {
      const port = process.env.PORT || 5000;
      const appUrl = process.env.BASE_URL || `http://localhost:${port}`;
      const authUrl = `${appUrl}/api/auth/github?userId=${encodeURIComponent(userId || "user")}`;

      return c.json({
        error: "Authorization Required",
        authUrl
      }, 401);
    }
    return c.json({ error: e.message }, 500);
  }


}
