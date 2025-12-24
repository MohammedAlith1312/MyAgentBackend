import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client";
import {
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";

let connected = false;
let connecting: Promise<void> | null = null;

const MCP_URL = new URL(process.env.GITHUB_MCP_URL!);

export const mcpClient = new Client({
  name: "voltagent-backend",
  version: "1.0.0",
});

export async function connectMcp(): Promise<void> {
  if (connected) return;

  if (!connecting) {
    connecting = (async () => {
      console.log("🔌 Connecting to GitHub MCP…");

      const transport = new StreamableHTTPClientTransport(MCP_URL, {
        // ✅ THIS is how auth is injected
        fetch: async (input, init = {}) => {
          const headers = new Headers(init.headers);

          headers.set(
            "Authorization",
            `Bearer ${process.env.GITHUB_AUTH_TOKEN}`
          );

          return fetch(input, {
            ...init,
            headers,
          });
        },
      });

      await mcpClient.connect(transport);

      // sanity check
      const tools = await mcpClient.listTools();
      console.log("🛠️ MCP TOOLS LIST:");
      // console.log(JSON.stringify(tools, null, 2)); // Comment out full dump to reduce noise
      const toolNames = tools.tools.map(t => t.name);
      console.log("Tool Names:", toolNames);

      if (!toolNames.includes("update_issue")) {
        console.warn("⚠️ NOTICE: 'update_issue' tool is MISSING from the MCP server. (Using REST API fallback)");
      } else {
        console.log("✅ 'update_issue' tool is present.");
      }

      connected = true;
      console.log("✅ GitHub MCP connected");
    })();
  }

  await connecting;
}

export function isMcpConnected(): boolean {
  return connected;
}
