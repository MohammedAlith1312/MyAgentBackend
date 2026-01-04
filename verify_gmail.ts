import "dotenv/config";
import { VoltOpsClient } from "@voltagent/core";

async function main() {
    console.log("Starting verification...");
    const voltops = new VoltOpsClient({
        publicKey: process.env.VOLTAGENT_PUBLIC_KEY!,
        secretKey: process.env.VOLTAGENT_SECRET_KEY!,
    });

    const credentialId = process.env.CREDENTIAL_ID;
    console.log("Credential ID:", credentialId);

    if (!credentialId) {
        console.error("Missing CREDENTIAL_ID");
        return;
    }

    try {
        console.log("Searching in:inbox...");
        const result = await voltops.actions.gmail.searchEmail({
            credential: { credentialId },
            query: "in:inbox",
            maxResults: 5,
        });
        console.log("Search Result Keys:", Object.keys(result));
        console.log("Search Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Search Failed:", error);
    }
}

main();
