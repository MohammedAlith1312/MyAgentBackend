import { pool } from "./live-eval";

export async function initTokensTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_tokens (
      user_id TEXT PRIMARY KEY,
      github_token TEXT,
      updated_at TIMESTAMP DEFAULT now()
    );
  `);
  console.log("✅ user_tokens table ready");
}

export async function storeToken(userId: string, token: string) {
  await pool.query(`
    INSERT INTO user_tokens (user_id, github_token, updated_at)
    VALUES ($1, $2, now())
    ON CONFLICT (user_id)
    DO UPDATE SET github_token = EXCLUDED.github_token, updated_at = now();
  `, [userId, token]);
  console.log(`✅ Token stored for user: ${userId}`);
}

export async function getToken(userId: string): Promise<string | null> {
  const res = await pool.query(`
    SELECT github_token FROM user_tokens WHERE user_id = $1
  `, [userId]);

  return res.rows[0]?.github_token || null;
}

export async function getMostRecentToken(): Promise<string | null> {
  const res = await pool.query(`
    SELECT github_token FROM user_tokens ORDER BY updated_at DESC LIMIT 1
  `);

  const token = res.rows[0]?.github_token || null;
  console.log(`🔍 [getMostRecentToken] Found token? ${!!token} (Count: ${res.rowCount})`);
  return token;
}