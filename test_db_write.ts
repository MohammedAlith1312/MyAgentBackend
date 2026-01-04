import "dotenv/config";
import { saveEmail, getEmailsFromDb, pool } from "./src/db/emails";

async function main() {
    console.log("--- Testing DB Write ---");
    try {
        const testId = `test-${Date.now()}`;
        console.log(`Saving email with ID: ${testId}`);

        await saveEmail({
            messageId: testId,
            threadId: testId,
            from: "db-tester@voltagent.com",
            to: "user@example.com",
            subject: "DB Persistence Test",
            body: "Testing if DB writes work.",
            type: "inbox",
            snippet: "Testing DB..."
        });

        console.log("Save called. Checking DB...");

        const emails = await getEmailsFromDb("inbox", 5);
        console.log(`Found ${emails.length} emails in inbox.`);

        const found = emails.find(e => e.id === testId);
        if (found) {
            console.log("SUCCESS: Found the saved email!");
        } else {
            console.error("FAILURE: Did not find the saved email.");
        }

    } catch (e) {
        console.error("Test Failed:", e);
    } finally {
        await pool.end();
    }
}

main();
