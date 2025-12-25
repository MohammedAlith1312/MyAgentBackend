import { buildScorer } from "@voltagent/core";
import {
  extractText,
  extractToolCalls,
  extractRequiresTool,
  countSteps,
  EvalPayload,
} from "./extractEvalData";

function isMathQuery(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();

  // 1. Explicit Keywords
  const keywords = ["calculate", "solve", "math", "compute", "equation"];
  if (keywords.some((k) => lower.includes(k))) return true;

  // 2. Contains numbers and operators (simple heuristic)
  // Matches "number operator number" pattern broadly, e.g. "2 + 2", "5*6"
  if (/\d+\s*[\+\-\*\/]\s*\d+/.test(text)) return true;

  return false;
}

export const mathLiveScorer = buildScorer({
  id: "math-reasoning",
})
  .score(({ payload }: { payload: EvalPayload }) => {
    const text = extractText(payload) ?? "";
    const stepCount = countSteps(text);
    const toolCalls = extractToolCalls(payload);
    const requiresTool = extractRequiresTool(payload);
    const userQuery = payload.rawInput?.[0]?.content ?? "";

    // 1. Relevance Check
    if (!isMathQuery(userQuery)) {
      return {
        score: 0,
        passed: false,
        metadata: { status: "skipped", reason: "not_math" },
      };
    }

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
