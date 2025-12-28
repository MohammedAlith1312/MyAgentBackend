
import { pool } from "./src/db/live-eval"; // Adjust import to point to correct DB pool file
import "dotenv/config";

async function checkTokens() {
    try {
        console.log("🔍 Checking user_tokens table...");
        const res = await pool.query("SELECT * FROM user_tokens");
        console.log(`📊 Found ${res.rowCount} tokens.`);
        if (res.rowCount > 0) {
            console.log("✅ Latest Token Row:", res.rows[0]);
        } else {
            console.log("❌ No tokens found in DB.");
        }
    } catch (err) {
        console.error("❌ DB Error:", err);
    } finally {
        process.exit();
    }
}

checkTokens();
