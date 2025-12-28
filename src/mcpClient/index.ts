import "dotenv/config";
import { getLatestGithubToken } from "../lib/githubToken";
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

  // If there's an existing connection attempt that failed, we might need to reset.
  // Ideally, if 'connecting' is rejected, we should allow a new attempt.
  // We can just await it and catch error to see?
  // Simpler: Wrap the assignment in try/catch block effectively? 
  // No, we need to handle the stored promise.

  if (!connecting) {
    connecting = (async () => {
      try {
        console.log("🔌 Connecting to GitHub MCP...");

        const transport = new StreamableHTTPClientTransport(MCP_URL, {
          fetch: async (input, init = {}) => {
            const headers = new Headers(init.headers);
            headers.set(
              "Authorization",
              `Bearer ${await getLatestGithubToken()}`
            );
            return fetch(input, { ...init, headers });
          },
        });

        await mcpClient.connect(transport);

        // sanity check
        const tools = await mcpClient.listTools();
        console.log("🛠️ MCP TOOLS LIST:");
        const toolNames = tools.tools.map(t => t.name);
        console.log("Tool Names:", toolNames);

        if (!toolNames.includes("update_issue")) {
          console.warn("⚠️ NOTICE: 'update_issue' tool is MISSING from the MCP server. (Using REST API fallback)");
        } else {
          console.log("✅ 'update_issue' tool is present.");
        }

        connected = true;
        console.log("✅ GitHub MCP connected");
      } catch (err) {
        console.error("❌ GitHub MCP Connection Failed:", err);
        connected = false;
        connecting = null; // ✅ RESET so we can try again next time
        throw err;
      }
    })();
  }

  try {
    await connecting;
  } catch (err) {
    // If the *current* attempt failed, we already reset `connecting` to null inside the async function.
    // We re-throw so the caller knows it failed.
    throw err;
  }
}

export function isMcpConnected(): boolean {
  return connected;
}
