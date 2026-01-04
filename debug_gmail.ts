import "dotenv/config";
import { VoltOpsClient } from "@voltagent/core";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const logPath = path.resolve(__dirname, "debug_output.txt");
    const log = (msg: string) => {
        try {
            fs.appendFileSync(logPath, msg + "\n");
        } catch (e) {
            console.error("Failed to write to log file", e);
        }
        console.log(msg);
    };

    // Clear previous log
    try { fs.writeFileSync(logPath, ""); } catch (e) { }

    log("--- STARTING DEBUG SIMULATION ---");

    const voltops = new VoltOpsClient({
        publicKey: process.env.VOLTAGENT_PUBLIC_KEY!,
        secretKey: process.env.VOLTAGENT_SECRET_KEY!,
    });

    const credentialId = process.env.CREDENTIAL_ID;
    log(`Credential ID: ${credentialId}`);

    if (!credentialId) {
        log("ERROR: Missing CREDENTIAL_ID");
        return;
    }

    try {
        log("Calling voltops.actions.gmail.searchEmail with query 'label:INBOX'...");
        const result = await voltops.actions.gmail.searchEmail({
            credential: { credentialId },
            query: "label:INBOX",
            maxResults: 5,
        });

        log("--- RAW RESULT TYPE ---");
        log(typeof result);

        log("--- RAW RESULT KEYS ---");
        log(JSON.stringify(Object.keys(result)));

        log("--- FULL JSON RESULT ---");
        log(JSON.stringify(result, null, 2));

    } catch (error) {
        log("API CALL FAILED: " + String(error));
        if (error instanceof Error) log(error.stack || "");
    }
    log("--- END DEBUG SIMULATION ---");
}

main();
