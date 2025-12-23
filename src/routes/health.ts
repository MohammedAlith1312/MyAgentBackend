import type { Context } from "hono";
import { isMcpConnected, connectMcp } from "../mcpClient";

export async function mcpHealthRoute(c: Context) {
  try {
    await connectMcp();
    return c.json({
      ok: true,
      mcpConnected: isMcpConnected(),
    });
  } catch (err) {
    return c.json({
      ok: false,
      mcpConnected: false,
      error: String(err),
    }, 500);
  }
}
