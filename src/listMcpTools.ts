
import "dotenv/config";
import { mcpClient, connectMcp } from "./mcpClient/index.js";

async function main() {
    try {
        await connectMcp();
        const tools = await mcpClient.listTools();
        console.log("MCP Tools:");
        tools.tools.forEach(t => console.log(t.name));
    } catch (e) {
        console.error("ERROR LISTING TOOLS:", e);
    } finally {
        console.log("Done listing tools.");
        process.exit(0);
    }
}

main();
