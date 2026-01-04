
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function aggressiveClean() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();

        console.log("Running AGGRESSIVE memory cleanup...");

        // 1. Delete any single message > 10k characters (strict limit)
        const hugeMsgRes = await client.query(`
            DELETE FROM voltagent_memory_messages 
            WHERE length(content::text) > 10000 
               OR length(parts::text) > 10000
        `);
        console.log(`Deleted ${hugeMsgRes.rowCount} massive messages (>10k chars).`);

        // 2. Keep only the last 20 messages per conversation (Prevent accumulation)
        // This is a bit complex in SQL, so we'll just do a global prune for now:
        // Delete older messages if total count > 50 (just to be safe globally)
        // Actually, let's just delete ALL messages for the current problematic conversation if we knew it.
        // But since we want to fix it generally, let's just delete really old messages.

        // Delete messages older than 24 hours (cleanup)
        // const oldMsgRes = await client.query(`
        //    DELETE FROM voltagent_memory_messages 
        //    WHERE created_at < NOW() - INTERVAL '1 day'
        // `);
        // console.log(`Deleted ${oldMsgRes.rowCount} old messages (>24h).`);

    } catch (err) {
        console.error("Error cleaning memory:", err);
    } finally {
        await client.end();
    }
}

aggressiveClean();
