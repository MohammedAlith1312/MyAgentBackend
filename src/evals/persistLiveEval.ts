import { pool } from "../db/live-eval";

export async function persistLiveEval(args: {
  scorerId: string;
  score: number;
  passed: boolean;
  metadata: Record<string, unknown>;
}) {
  await pool.query(
    `
    INSERT INTO live_eval_results
      (conversation_id, scorer_id, score, passed, metadata)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      args.metadata.conversationId ?? null,
      args.scorerId,
      args.score,
      args.passed,
      args.metadata,
    ]
  );
}
