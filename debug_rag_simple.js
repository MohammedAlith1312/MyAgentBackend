const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    console.log("Connecting...");
    try {
        await client.connect();
        console.log("Connected.");

        const count = await client.query("SELECT COUNT(*) FROM voltagent_vector_vectors");
        console.log(`Vectors count: ${count.rows[0].count}`);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
        console.log("Done.");
    }
}

run();
