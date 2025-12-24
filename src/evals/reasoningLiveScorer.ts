import { buildScorer } from "@voltagent/core";
import {
  extractText,
  extractToolCalls,
  countSteps,
  EvalPayload,
} from "./extractEvalData";

export const logicalReasoningLiveScorer = buildScorer({
  id: "logical-reasoning",
})
  .score(({ payload }: { payload: EvalPayload }) => {
    const text = extractText(payload) ?? "";
    const toolCalls = extractToolCalls(payload);
    const stepCount = countSteps(text);
    const mode = toolCalls.length ? "tool_based" : "knowledge_based";

    if (!text) {
      return {
        score: 10,
        passed: false,
        metadata: { mode, stepCount: 0 },
      };
    }

    let score = 0;
    if (/(because|therefore|thus|due to)/i.test(text)) score += 40;
    if (text.length > 20) score += 40;

    score = Math.min(score, 100);

    return {
      score,
      passed: score >= 60,
      metadata: { mode, stepCount },
    };
  })
  .build();
