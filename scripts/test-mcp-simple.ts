
import "dotenv/config";
import { connectMcp, mcpClient } from "../src/mcpClient";

async function main() {
    console.log("Checking MCP connection...");
    try {
        await connectMcp();
        console.log("Connected!");
        const tools = await mcpClient.listTools();
        console.log("Tools:", JSON.stringify(tools.tools.map(t => t.name), null, 2));
    } catch (e) {
        console.error("Connection failed:", e);
    }
    process.exit(0);
}

main();
