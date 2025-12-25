export type EvalPayload = {
    output?: string | { text?: string };
    messages?: { role?: string; content?: string }[];
    metadata?: {
        toolCalls?: any[];
    };
    rawInput?: {
        role?: string;
        content?: string;
        metadata?: {
            requiresTool?: boolean;
        };
    }[];
};

export function extractText(payload?: EvalPayload): string | null {
    if (!payload) return null;

    if (typeof payload.output === "string") return payload.output;
    if (typeof payload.output?.text === "string") return payload.output.text;

    if (Array.isArray(payload.messages)) {
        for (let i = payload.messages.length - 1; i >= 0; i--) {
            if (payload.messages[i]?.content) {
                return payload.messages[i].content!;
            }
        }
    }

    return null;
}

export function extractToolCalls(payload?: EvalPayload): any[] {
    console.log("🔍 [extractToolCalls] Full payload:", JSON.stringify(payload, null, 2));

    let rawCalls: any[] = payload?.metadata?.toolCalls ?? [];
    console.log("🔍 [extractToolCalls] Tool calls from metadata:", rawCalls);

    // Fallback: search messages for tool calls
    if (rawCalls.length === 0 && Array.isArray(payload?.messages)) {
        console.log("🔍 [extractToolCalls] Searching messages for tool calls...");
        for (const msg of payload!.messages) {
            const calls = (msg as any).tool_calls || (msg as any).toolCalls;
            if (Array.isArray(calls)) {
                console.log("🔍 [extractToolCalls] Found tool calls in message:", calls);
                rawCalls.push(...calls);
            }
        }
    }

    // Normalize tool calls to have 'name' and 'args' (supporting 'toolName', 'arguments', and 'input' aliases)
    const normalized = rawCalls.map(tc => {
        let args = tc.args || tc.arguments || tc.function?.arguments || tc.input || {};
        if (typeof args === 'string') {
            try {
                args = JSON.parse(args);
            } catch (e) {
                // Keep as string if parsing fails
            }
        }
        return {
            name: tc.name || tc.toolName || tc.function?.name,
            args,
        };
    });

    console.log("🔍 [extractToolCalls] Normalized tool calls:", normalized);
    return normalized;
}

export function extractRequiresTool(payload?: EvalPayload): boolean {
    return Boolean(payload?.rawInput?.[0]?.metadata?.requiresTool);
}

export function countSteps(text: string): number {
    return text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean).length;
}
