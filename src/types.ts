export interface AgentEvalResult {
    status: "success" | "failure" | "error" | string;
    score?: number | null;
    passed?: boolean | null;
    metadata?: Record<string, unknown> | null;
    payload?: any;
    error?: unknown;
}
