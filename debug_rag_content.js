const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();

        // 1. Check if table exists and get count
        const res = await client.query("SELECT to_regclass('voltagent_vector_vectors')");
        if (!res.rows[0].to_regclass) {
            console.error("❌ Table 'voltagent_vector_vectors' does not exist!");
            return;
        }

        const count = await client.query("SELECT COUNT(*) FROM voltagent_vector_vectors");
        console.log(`📊 Total vectors in DB: ${count.rows[0].count}`);

        // 2. Dump content of the uploaded file
        console.log("\n📄 Checking content for 'MohammedAlith.pdf' (or specific keywords)...");
        const rows = await client.query(`
            SELECT id, content, metadata 
            FROM voltagent_vector_vectors 
            LIMIT 20
        `);

        if (rows.rows.length === 0) {
            console.log("⚠️ No vectors found.");
        }

        for (const row of rows.rows) {
            const content = row.content || "";
            const meta = row.metadata || {};
            console.log(`\n--- Chunk ${row.id.substring(0, 8)} ---`);
            console.log(`Metadata:`, JSON.stringify(meta));
            console.log(`Content Preview: ${content.substring(0, 200)}...`);

            // Check for keyword matches
            if (content.toLowerCase().includes("cgpa")) {
                console.log("🎯 MATCH FOUND for 'cgpa' in this chunk!");
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
