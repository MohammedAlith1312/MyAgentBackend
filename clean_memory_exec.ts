
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function cleanMemory() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();

        // Delete messages where the text representation of the row is excessively large
        // Ideally we check 'content' or 'parts' column size.
        // For safety, we'll target rows where length(content::text) > 50000 OR length(parts::text) > 50000

        console.log("Cleaning up large messages (>50k chars)...");

        const res = await client.query(`
            DELETE FROM voltagent_memory_messages 
            WHERE length(content::text) > 50000 
               OR length(parts::text) > 50000
            RETURNING id;
        `);

        console.log(`Deleted ${res.rowCount} large messages.`);
        res.rows.forEach(r => console.log(` - Deleted ID: ${r.id}`));

    } catch (err) {
        console.error("Error cleaning memory:", err);
    } finally {
        await client.end();
    }
}

cleanMemory();
