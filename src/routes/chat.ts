import type { Context } from "hono";
import type { Agent, BaseMessage, Memory } from "@voltagent/core";

/* --------------------------------------------------
   Helpers: UI → BaseMessage
-------------------------------------------------- */

function uiMessageToBaseMessage(msg: any): BaseMessage | null {
  if (!msg?.role) return null;

  if (Array.isArray(msg.parts)) {
    const text = msg.parts
      .filter((p: any) => p?.type === "text" && p.text)
      .map((p: any) => p.text)
      .join(" ");

    if (text) {
      return { role: msg.role, content: text };
    }
  }

  if (typeof msg.content === "string") {
    return { role: msg.role, content: msg.content };
  }

  if (typeof msg.text === "string") {
    return { role: msg.role, content: msg.text };
  }

  return null;
}

/* --------------------------------------------------
   OPTION A: Deterministic Math Handler (NO AGENT)
-------------------------------------------------- */

function cleanMathInput(input: string): string {
  return input
    .toLowerCase()
    .replace(/solve|answer|=/g, "")
    .trim();
}

function isPureMathExpression(input: string): boolean {
  return /^[\d\s+\-*/().]+$/.test(input);
}

function evaluateMath(expression: string): number {
  return Function(`"use strict"; return (${expression})`)();
}

/* --------------------------------------------------
   Chat Route
-------------------------------------------------- */

export function chatRoute(deps: {
  agent: Agent;
  memory: Memory;
  USER_ID: string;
}) {
  const { agent, memory, USER_ID } = deps;

  return async (c: Context) => {
    const body = await c.req.json();
    const rawText = String(body.text ?? "").trim();

    if (!rawText) {
      return c.json({ ok: false, error: "Empty input" }, 400);
    }

    const conversationId =
      body.conversationId ??
      `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    /* ==================================================
       ✅ HANDLE MATH BEFORE AGENT (CRITICAL)
       ================================================== */

    const cleanedText = cleanMathInput(rawText);

    if (isPureMathExpression(cleanedText)) {
      try {
        const result = evaluateMath(cleanedText);

        return c.json({
          ok: true,
          text: `Steps:\n${cleanedText} = ${result}\n\nAnswer:\n${result}`,
          conversationId,
        });
      } catch {
        // If math evaluation fails, fall through to agent
      }
    }

    /* ==================================================
       Normal Chat (Agent + Memory + Tools)
       ================================================== */

    const historyUI = await memory.getMessages(
      USER_ID,
      conversationId,
      { limit: 10 }
    );

    const history: BaseMessage[] = historyUI
      .map(uiMessageToBaseMessage)
      .filter(Boolean) as BaseMessage[];

    const messages: BaseMessage[] = [
      ...history,
      { role: "user", content: rawText },
    ];

    const result = await agent.generateText(messages, {
      userId: USER_ID,
      conversationId,
    });

    return c.json({
      ok: true,
      text: result.text,
      conversationId,
    });
  };
}
