
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function cleanUp() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Connected to database.");

        // Drop the specific table mentioned by user
        await client.query('DROP TABLE IF EXISTS "voltagent_vector_vectors" CASCADE');
        console.log("Dropped table 'voltagent_vector_vectors' if it existed.");

    } catch (err) {
        console.error("Error cleaning up:", err);
    } finally {
        await client.end();
    }
}

cleanUp();
