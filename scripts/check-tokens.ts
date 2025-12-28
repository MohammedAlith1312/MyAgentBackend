
import "dotenv/config";
import { pool } from "../src/db/live-eval";

async function checkTokens() {
    try {
        console.log("Checking user_tokens table...");
        const res = await pool.query("SELECT * FROM user_tokens");
        console.log("Token count:", res.rowCount);
        console.log("Rows:", res.rows);
    } catch (err) {
        console.error("Error querying table:", err);
    } finally {
        await pool.end();
    }
}

checkTokens();
