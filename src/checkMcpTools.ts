
import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function main() {
    const url = process.env.GITHUB_MCP_URL;
    if (!url) {
        console.error("GITHUB_MCP_URL not set");
        return;
    }

    const transport = new StreamableHTTPClientTransport(new URL(url), {
        fetch: fetch,
    });

    const client = new Client({
        name: "tool-checker",
        version: "1.0.0",
    });

    await client.connect(transport);

    console.log("Connected to MCP. Listing tools...");
    const result = await client.listTools();

    console.log("Available Tools:");
    result.tools.forEach(t => {
        console.log(`- ${t.name}: ${t.description}`);
    });

    await client.close();
}

main().catch(console.error);
