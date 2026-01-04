import "dotenv/config";
import { VoltOpsClient } from "@voltagent/core";
import { saveEmail } from "./src/db/emails";
import { pool } from "./src/db/emails";

async function main() {
    console.log("Starting full sync simulation...");

    const voltops = new VoltOpsClient({
        publicKey: process.env.VOLTAGENT_PUBLIC_KEY!,
        secretKey: process.env.VOLTAGENT_SECRET_KEY!,
    });

    const credentialId = process.env.CREDENTIAL_ID;
    if (!credentialId) {
        console.error("Missing CREDENTIAL_ID");
        return;
    }

    try {
        console.log("1. Searching Gmail (label:INBOX)...");
        const searchResult = await voltops.actions.gmail.searchEmail({
            credential: { credentialId },
            query: "label:INBOX",
            maxResults: 5,
        });

        console.log("Search raw result:", JSON.stringify(searchResult).substring(0, 200) + "...");

        const searchPayload = searchResult as any;
        const messages = searchPayload.messages || [];

        if (messages.length === 0) {
            console.log("No messages found in Inbox.");
        } else {
            console.log(`Found ${messages.length} messages. Processing first one...`);
            const msg = messages[0];

            console.log(`2. Fetching details for ${msg.id}...`);
            const emailResult = await voltops.actions.gmail.getEmail({
                credential: { credentialId },
                messageId: msg.id,
                format: "metadata",
            });
            const email = emailResult as any;
            const snippet = email.snippet || "No snippet";
            console.log(`Email snippet: ${snippet}`);

            console.log(`3. Saving to DB...`);
            await saveEmail({
                messageId: msg.id,
                threadId: msg.threadId,
                from: "test-sender",
                to: "test-recipient",
                subject: "Test Subject from Simulation",
                body: snippet,
                snippet: snippet,
                type: 'inbox'
            });
            console.log("Save complete.");
        }

    } catch (error) {
        console.error("Simulation failed:", error);
    } finally {
        await pool.end();
    }
}

main();
