import { Pool } from "pg";

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
});

export async function initEmailsTable() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS emails (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id TEXT UNIQUE,
      thread_id TEXT,
      sender TEXT, -- 'from' is keyword
      recipient TEXT, -- 'to' 
      subject TEXT,
      body TEXT,
      snippet TEXT,
      list_type TEXT, -- 'inbox' | 'sent'
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

    // Migration: Add attachments column if not exists
    try {
        await pool.query(`ALTER TABLE emails ADD COLUMN IF NOT EXISTS attachments JSONB`);
    } catch (e) {
        console.log("Attachments column might already exist or failed to add", e);
    }
}

export async function saveEmail(email: {
    messageId?: string;
    threadId?: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    snippet?: string;
    type: 'inbox' | 'sent';
    attachments?: { filename: string, content: string, type: string }[];
}) {
    console.log(`[DB] Saving email: ${email.messageId} (${email.type})`);
    const client = await pool.connect();
    try {
        await client.query(
            `INSERT INTO emails (message_id, thread_id, sender, recipient, subject, body, snippet, list_type, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (message_id) 
       DO UPDATE SET body = EXCLUDED.body, attachments = EXCLUDED.attachments`,
            [
                email.messageId || `local-${Date.now()}`,
                email.threadId,
                email.from,
                email.to,
                email.subject,
                email.body,
                email.snippet || email.body.substring(0, 100),
                email.type,
                JSON.stringify(email.attachments || [])
            ]
        );
        console.log(`[DB] Saved email successfully.`);
    } catch (err) {
        console.error("[DB] Failed to save email:", err);
    } finally {
        client.release();
    }
}

export async function getEmailsFromDb(type: 'inbox' | 'sent', limit = 50) {
    console.log(`[DB] Fetching ${type}, limit ${limit}`);
    const res = await pool.query(
        `SELECT * FROM emails WHERE list_type = $1 ORDER BY created_at DESC LIMIT $2`,
        [type, limit]
    );
    console.log(`[DB] Found ${res.rowCount} emails.`);

    return res.rows.map(row => ({
        id: row.message_id || row.id,
        threadId: row.thread_id,
        from: row.sender,
        to: row.recipient,
        subject: row.subject,
        body: row.body,
        snippet: row.snippet,
        date: row.created_at,
        attachments: row.attachments || [],
        status: row.list_type === 'sent' ? 'EMAIL_SENT' : 'RECEIVED'
    }));
}
