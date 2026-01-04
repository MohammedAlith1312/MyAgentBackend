
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function checkMemory() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();

        // Check for top 5 largest messages by character length of 'content' inside the JSON or 'parts'
        // The table schema is likely (id, content, ...) or (id, role, parts, ...)
        // Let's assume standard structure from inspection or just query all and check length in JS.

        // First get schema or just try to select * limit 10
        const res = await client.query('SELECT * FROM voltagent_memory_messages ORDER BY created_at DESC LIMIT 20');

        console.log("Checking last 20 messages...");
        for (const row of res.rows) {
            const content = row.content ? JSON.stringify(row.content) : '';
            const parts = row.parts ? JSON.stringify(row.parts) : '';
            const length = Math.max(content.length, parts.length);

            console.log(`Msg ID: ${row.id}, Role: ${row.role}, Length: ${length} chars`);
            if (length > 10000) {
                console.log(`⚠️ HUGE MESSAGE DETECTED: ${row.id}`);
                console.log(`Preview: ${content.substring(0, 100)}...`);
            }
        }

    } catch (err) {
        console.error("Error checking memory:", err);
    } finally {
        await client.end();
    }
}

checkMemory();
