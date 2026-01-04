import "dotenv/config";
import { VoltOpsClient } from "@voltagent/core";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const logPath = path.resolve(__dirname, "debug_labels.txt");
    const log = (msg: string) => {
        try { fs.appendFileSync(logPath, msg + "\n"); } catch (e) { }
        console.log(msg);
    };

    // Clear log
    try { fs.writeFileSync(logPath, ""); } catch (e) { }

    log("--- STARTING LABEL DEBUG ---");

    const voltops = new VoltOpsClient({
        publicKey: process.env.VOLTAGENT_PUBLIC_KEY!,
        secretKey: process.env.VOLTAGENT_SECRET_KEY!,
    });

    const credentialId = process.env.CREDENTIAL_ID;
    if (!credentialId) {
        log("ERROR: Missing CREDENTIAL_ID");
        return;
    }

    try {
        log("Attempting to list profile info...");
        try {
            const profile = await voltops.actions.gmail.getProfile({ credential: { credentialId } });
            log("Profile Result keys: " + Object.keys(profile).join(", "));
            log("Email Address: " + (profile as any).emailAddress);
            log("Messages Total: " + (profile as any).messagesTotal);
        } catch (e) {
            log("Failed to get profile: " + String(e));
        }

        log("\nAttempting to list labels...");
        // internal API call usually used by search but accessible if client exposes it?
        // VoltOps client might not expose listLabels directly on actions.gmail
        // We will try to infer connectivity via profile first.

        // If profile messagesTotal is > 0, we know the account has mail.

    } catch (error) {
        log("FATAL ERROR: " + String(error));
    }
    log("--- END LABEL DEBUG ---");
}

main();
