import "dotenv/config";
import { VoltOpsClient } from "@voltagent/core";
import { saveEmail, pool } from "./src/db/emails";

async function syncLabel(voltops: VoltOpsClient, labelInfo: { query: string, type: 'inbox' | 'sent', name: string }) {
    console.log(`\n--- Syncing ${labelInfo.name} (${labelInfo.query}) ---`);
    try {
        const credentialId = process.env.CREDENTIAL_ID!;

        // Search
        const searchResult = await voltops.actions.gmail.searchEmail({
            credential: { credentialId },
            query: labelInfo.query,
            maxResults: 50,
        });

        const raw: any = searchResult;
        const messages = raw.messages || raw.data?.messages || raw.payload?.messages || [];

        console.log(`Found ${messages.length} messages.`);

        if (messages.length === 0) return;

        let savedCount = 0;
        for (const msg of messages) {
            try {
                // Get Details
                const detailResult: any = await voltops.actions.gmail.getEmail({
                    credential: { credentialId },
                    messageId: msg.id,
                    format: "metadata",
                });

                const headers = detailResult.payload?.headers ?? [];
                const from = headers.find((h: any) => h.name === "From")?.value ?? "Unknown";
                const to = headers.find((h: any) => h.name === "To")?.value ?? "Unknown";
                const subject = headers.find((h: any) => h.name === "Subject")?.value ?? "(No Subject)";

                await saveEmail({
                    messageId: msg.id,
                    threadId: msg.threadId,
                    from,
                    to,
                    subject,
                    body: detailResult.snippet || "",
                    snippet: detailResult.snippet || "",
                    type: labelInfo.type
                });
                savedCount++;
                if (savedCount % 10 === 0) process.stdout.write(".");
            } catch (err) {
                // console.error(`Error fetching ${msg.id}`, err);
            }
        }
        console.log(`\nSaved ${savedCount} messages to DB.`);
    } catch (e) {
        console.error(`Failed to sync ${labelInfo.name}:`, e);
    }
}

async function main() {
    console.log("Starting FORCE SYNC...");

    const voltops = new VoltOpsClient({
        publicKey: process.env.VOLTAGENT_PUBLIC_KEY!,
        secretKey: process.env.VOLTAGENT_SECRET_KEY!,
    });

    if (!process.env.CREDENTIAL_ID) {
        console.error("Missing CREDENTIAL_ID env var");
        return;
    }

    await syncLabel(voltops, { name: "Inbox", query: "in:inbox", type: "inbox" });
    await syncLabel(voltops, { name: "Sent", query: "label:SENT", type: "sent" });

    console.log("\nSync Complete.");
    await pool.end();
}

main();
