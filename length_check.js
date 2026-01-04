const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();

        // Count total rows
        const countRes = await client.query('SELECT COUNT(*) FROM voltagent_memory_messages');
        console.log(`Total messages: ${countRes.rows[0].count}`);

        // Get lengths only
        console.log("Checking lengths of last 10 messages...");
        const res = await client.query(`
            SELECT id, role, length(content::text) as len 
            FROM voltagent_memory_messages 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        for (const row of res.rows) {
            console.log(`Msg ${row.id} [${row.role}]: ${row.len} chars`);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
