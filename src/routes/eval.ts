import type { Context } from "hono";
import { pool } from "../db/live-eval";

export function getLiveEvalsRoute() {
  return async (c: Context) => {
    const conversationId = c.req.query("conversationId");

    const { rows } = await pool.query(
      `
      SELECT *
      FROM live_eval_results
      WHERE ($1::text IS NULL OR metadata->>'conversationId' = $1)
      ORDER BY created_at DESC
      `,
      [conversationId ?? null]
    );

    return c.json(rows);
  };
}
