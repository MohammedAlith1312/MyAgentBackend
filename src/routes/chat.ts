import type { Context } from "hono";
import type { Agent, BaseMessage, Memory } from "@voltagent/core";

export function chatRoute(deps: {
  agent: Agent;
  memory: Memory;
  USER_ID: string;
}) {
  const { agent, memory, USER_ID } = deps;

  return async (c: Context) => {
    const body = await c.req.json();
    const text = String(body.text ?? "").trim();

    if (!text) {
      return c.json({ ok: false }, 400);
    }

    const conversationId =
      body.conversationId ??
      `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const messages: BaseMessage[] = [
      { role: "user", content: text },
    ];

    const result = await agent.generateText(messages, {
      userId: USER_ID,
      conversationId, // goes into payload → metadata
    });

    return c.json({
      ok: true,
      text: result.text,
      conversationId,
    });
  };
}
