const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to DB");

        // Check Messages
        console.log("Checking last 10 messages...");
        const res = await client.query('SELECT id, role, content FROM voltagent_memory_messages ORDER BY created_at DESC LIMIT 10');

        for (const row of res.rows) {
            let len = 0;
            let preview = "";
            if (typeof row.content === 'string') {
                len = row.content.length;
                preview = row.content.substring(0, 50);
            } else {
                const s = JSON.stringify(row.content);
                len = s.length;
                preview = s.substring(0, 50);
            }
            console.log(`Msg ${row.id} (${row.role}): ${len} chars. Preview: ${preview}...`);
        }

        // Check Vectors table name. Default is usually voltagent_vector_vectors or vectors
        // Let's try to query current schema tables to find it
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log("Tables:", tables.rows.map(r => r.table_name).join(', '));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
