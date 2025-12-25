import { persistLiveEval } from "../evals/persistLiveEval";
import { logicalReasoningLiveScorer } from "../evals/reasoningLiveScorer";
import { mathLiveScorer } from "../evals/mathLiveScorer";
import { gmailLiveScorer } from "../evals/gmailLiveScorer";
import { githubLiveScorer } from "../evals/githubLiveScorer";

const createScorerConfig = (scorerId: string, scorer: any) => ({
    scorer,
    onResult: async (result: any) => {
        if (result.metadata?.status === "skipped") return;
        const score = result.score ?? 0;
        await persistLiveEval({
            scorerId,
            score,
            passed: score >= 60,
            metadata: {
                ...result.metadata,
                conversationId: result.payload?.conversationId ?? null,
            },
        });
    },
});

export const liveEvalConfig = {
    triggerSource: "production",
    environment: "backend-api",
    sampling: { type: "ratio", rate: 1 },
    scorers: {
        math: createScorerConfig("math-reasoning", mathLiveScorer),
        logical: createScorerConfig("logical-reasoning", logicalReasoningLiveScorer),
        gmail: createScorerConfig("gmail-action", gmailLiveScorer),
        github: createScorerConfig("github-action", githubLiveScorer),
    },
} as const;
