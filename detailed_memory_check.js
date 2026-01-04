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
        console.log("Checking last 20 messages...");
        const res = await client.query('SELECT id, role, content FROM voltagent_memory_messages ORDER BY created_at DESC LIMIT 20');

        for (const row of res.rows) {
            let contentStr = "";
            let size = 0;

            if (typeof row.content === 'string') {
                contentStr = row.content;
            } else {
                contentStr = JSON.stringify(row.content);
            }

            size = contentStr.length;
            const sizeInTokensEst = size / 4;

            console.log(`Msg ${row.id} [${row.role}]: ${size} chars (~${Math.round(sizeInTokensEst)} tokens).`);

            if (size > 1000) {
                console.log(`PREVIEW: ${contentStr.substring(0, 100)}...`);
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
