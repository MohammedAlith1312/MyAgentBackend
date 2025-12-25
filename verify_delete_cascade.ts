
import { pool } from "./src/db/live-eval";

async function verifyCascade() {
    const testId = "test-cascade-delete-" + Date.now();
    console.log("Testing with ID:", testId);

    try {
        // 1. Insert dummy data
        await pool.query(`
      INSERT INTO live_eval_results (conversation_id, scorer_id, score, passed, metadata)
      VALUES ($1, 'test-scorer', 50, true, '{}')
    `, [testId]);
        console.log("Requested insert.");

        // Verify insert
        const res1 = await pool.query("SELECT * FROM live_eval_results WHERE conversation_id = $1", [testId]);
        if (res1.rowCount === 1) {
            console.log("✅ Insert successful.");
        } else {
            console.error("❌ Insert failed.");
            return;
        }

        // 2. Run Delete Logic (simulating the route)
        await pool.query("DELETE FROM live_eval_results WHERE conversation_id = $1", [testId]);
        console.log("Requested delete.");

        // 3. Verify Delete
        const res2 = await pool.query("SELECT * FROM live_eval_results WHERE conversation_id = $1", [testId]);
        if (res2.rowCount === 0) {
            console.log("✅ Delete successful. Row is gone.");
        } else {
            console.error("❌ Delete failed. Row still exists.");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        // Cleanup if needed (though delete should have handled it)
        await pool.end();
    }
}

verifyCascade();
