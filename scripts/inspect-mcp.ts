
import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = new URL(process.env.GITHUB_MCP_URL!);

async function main() {
    console.log("🔌 Connecting to GitHub MCP at", MCP_URL.toString());

    const client = new Client({
        name: "inspector",
        version: "1.0.0",
    });

    const transport = new StreamableHTTPClientTransport(MCP_URL, {
        fetch: async (input, init = {}) => {
            const headers = new Headers(init.headers);
            headers.set("Authorization", `Bearer ${process.env.GITHUB_AUTH_TOKEN}`);
            return fetch(input, { ...init, headers });
        },
    });

    await client.connect(transport);
    console.log("✅ Connected");

    const result = await client.listTools();
    console.log("🛠️ Available Tools:");
    console.log(JSON.stringify(result.tools, null, 2));

    process.exit(0);
}

main().catch(console.error);
