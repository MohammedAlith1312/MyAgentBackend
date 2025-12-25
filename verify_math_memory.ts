
import { memory } from "./src/index";

async function verifyMathMemory() {
    const userId = "test-user-math-" + Date.now();
    const convId = "test-conv-math-" + Date.now();

    console.log(`Testing Math Memory Persistence...`);

    // 1. Manually simulate the persistence logic we added (since we can't easily curl the running server from here without ensuring it's up)
    // Actually, to verify the CODE logic, we should probably check if the method calls work. 
    // But since I changed the call signature, I want to be sure it doesn't throw at runtime.

    try {
        console.log("Adding User Message...");
        await memory.addMessage(
            { id: "msg1", role: "user", parts: [{ type: "text", text: "2+2" }] },
            userId,
            convId
        );

        console.log("Adding Assistant Message...");
        await memory.addMessage(
            { id: "msg2", role: "assistant", parts: [{ type: "text", text: "4" }] },
            userId,
            convId
        );

        console.log("✅ Messages added without error.");

        // 2. Retrieve
        console.log("Retrieving messages...");
        const msgs = await memory.getMessages(userId, convId, { limit: 10 });

        const msg1Text = (msgs[0] as any).parts?.[0]?.text ?? (msgs[0] as any).content ?? (msgs[0] as any).text;
        const msg2Text = (msgs[1] as any).parts?.[0]?.text ?? (msgs[1] as any).content ?? (msgs[1] as any).text;

        if (msgs.length === 2 && msg1Text === "2+2" && msg2Text === "4") {
            console.log("✅ Verification Successful: Math conversation persisted.");
        } else {
            console.error("❌ Verification Failed: Messages not found or incorrect.");
            console.log("Retrieved:", msgs);
        }

    } catch (e) {
        console.error("❌ Verification Error:", e);
    }
}

// We rely on index.ts exporting 'memory' but index.ts initializes DB connections at top level await 
// so this might fail if we don't handle that. 
// However, the memory object export is what we need. 
// A safer bet might be to instantiate a fresh memory instance similar to index.ts to test the API signature.

import { Memory } from "@voltagent/core";
import { PostgreSQLMemoryAdapter } from "@voltagent/postgres";
import "dotenv/config";

async function verifyClean() {
    const mem = new Memory({
        storage: new PostgreSQLMemoryAdapter({ connection: process.env.DATABASE_URL! })
    });

    // Test the signature directly
    try {
        await mem.addMessage({
            id: "test-id-1",
            role: "user",
            parts: [{ type: "text", text: "test" }]
        }, "u1", "c1");
        console.log("✅ Signature is valid.");
    } catch (e) {
        console.error("❌ Signature failure:", e);
    }
}

verifyClean();
