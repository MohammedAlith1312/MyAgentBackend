// src/routes/telemetry-guardrails.ts
import type { Context } from "hono";
import { pool } from "../db/live-eval";

export function telemetryGuardrailsRoute() {
  return async (c: Context) => {
    const { rows } = await pool.query(`
      SELECT
        conversation_id,
        name            AS guardrail_name,
        name            AS guardrail_id,
        status,
        metadata,
        created_at
      FROM telemetry_events
      WHERE event_type = 'GUARDRAIL'
      ORDER BY created_at DESC
    `);

    const normalized = rows.map(row => ({
      conversation_id: row.conversation_id,
      guardrail_name: row.guardrail_name,
      guardrail_id: row.guardrail_id,
      status: row.status,                 // passed | blocked | modified
      type: row.metadata?.type ?? "input",
      input_data: row.metadata?.inputText ?? null,
      output_data: row.metadata?.modifiedInput ?? null,
      metadata: row.metadata ?? {},
      created_at: row.created_at,
    }));

    return c.json(normalized);
  };
}
