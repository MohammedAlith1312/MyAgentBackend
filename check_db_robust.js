
require("dotenv").config();
const { Pool } = require("pg");

console.log("Environment loaded.");
console.log("DB URL Length:", process.env.DATABASE_URL ? process.env.DATABASE_URL.length : "MISSING");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkTokens() {
    try {
        console.log("🔍 Checking user_tokens table...");
        const res = await pool.query("SELECT * FROM user_tokens");
        console.log(`📊 Found ${res.rowCount} tokens.`);
        if (res.rowCount > 0) {
            console.log("✅ Latest Token Row:", JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log("❌ No tokens found in DB.");
        }
    } catch (err) {
        console.error("❌ DB Error:", err.message);
    } finally {
        pool.end();
    }
}

checkTokens();
