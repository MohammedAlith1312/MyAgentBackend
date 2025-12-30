import type { Context } from "hono";
import { isMcpConnected, connectMcp } from "../mcpClient";

export async function mcpHealthRoute(c: Context) {
  try {
    await connectMcp();
    const { mcpClient } = await import("../mcpClient");
    const tools = await mcpClient.listTools();
    return c.json({
      ok: true,
      mcpConnected: isMcpConnected(),
      tools: tools.tools.map(t => t.name)
    });
  } catch (err) {
    return c.json({
      ok: false,
      mcpConnected: false,
      error: String(err),
    }, 500);
  }
}
