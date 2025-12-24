import { buildScorer } from "@voltagent/core";
import {
  extractText,
  extractToolCalls,
  extractRequiresTool,
  countSteps,
  EvalPayload,
} from "./extractEvalData";

export const mathLiveScorer = buildScorer({
  id: "math-reasoning",
})
  .score(({ payload }: { payload: EvalPayload }) => {
    const text = extractText(payload) ?? "";
    const stepCount = countSteps(text);
    const toolCalls = extractToolCalls(payload);
    const requiresTool = extractRequiresTool(payload);

    const mode = toolCalls.length ? "tool_based" : "knowledge_based";

    // Tool required but skipped
    if (requiresTool && toolCalls.length === 0) {
      return {
        score: 0,
        passed: false,
        metadata: { mode, stepCount },
      };
    }

    // Knowledge-based math
    if (!requiresTool && toolCalls.length === 0) {
      const score = stepCount >= 2 ? 70 : 40;
      return {
        score,
        passed: score >= 60,
        metadata: { mode, stepCount },
      };
    }

    // Tool-based math
    const score =
      stepCount >= 4 ? 100 :
        stepCount >= 3 ? 90 :
          stepCount >= 2 ? 60 :
            40;

    return {
      score,
      passed: score >= 60,
      metadata: { mode, stepCount },
    };
  })
  .build();
