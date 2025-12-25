
import { Memory } from "@voltagent/core";
import { PostgreSQLMemoryAdapter } from "@voltagent/postgres";
import "dotenv/config";

async function inspectMemory() {
    console.log("Inspecting Memory...");
    const mem = new Memory({
        storage: new PostgreSQLMemoryAdapter({ connection: process.env.DATABASE_URL! })
    });

    console.log("Memory keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(mem)));
    // Also try to call addMessage if it exists
    if (typeof (mem as any).addMessage === 'function') {
        console.log("✅ addMessage exists");
    } else {
        console.log("❌ addMessage DOES NOT exist");
    }
    if (typeof (mem as any).addMessages === 'function') {
        console.log("✅ addMessages exists");
    }
}

inspectMemory();
