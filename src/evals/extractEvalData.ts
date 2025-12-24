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
    return payload?.metadata?.toolCalls ?? [];
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
