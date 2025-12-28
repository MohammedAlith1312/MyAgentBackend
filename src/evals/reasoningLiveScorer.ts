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
    console.log("🎯 [logicalReasoningLiveScorer] Tool calls:", toolCalls.length);
    const stepCount = countSteps(text);
    const mode = toolCalls.length ? "tool_based" : "knowledge_based";

    // If tools are used, we consider that "reason enough" for a functional agent.
    if (toolCalls.length > 0) {
      let toolScore = 70; // Base pass for using a tool

      // Bonus if they also explained it
      if (text.length > 20) toolScore += 20;

      return {
        score: Math.min(toolScore, 100),
        passed: true,
        metadata: { mode, stepCount, toolCalls: toolCalls.length }
      };
    }

    if (!text) {
      return {
        score: 10,
        passed: false,
        metadata: { mode, stepCount: 0 },
      };
    }

    let score = 0;

    // 1. Length (Base Confidence)
    // If it's effectively empty (< 10 chars), it stays 0.
    // Moderate length gives a base to build on.
    if (text.length > 50) score += 30;

    // 2. Keywords (Broadened)
    // We look for words that indicate explanation, consequence, or process.
    const indicators = [
      "because", "therefore", "thus", "due to", "since", "so",
      "means", "implies", "step", "reason", "conclude", "result",
      "first", "finally", "example", "logic"
    ];
    if (new RegExp(indicators.join("|"), "i").test(text)) score += 30;

    // 3. Structure & Formatting
    // Bullet points or numbered lists indicate structured thinking.
    if (/^[\-\*] |\d+\. /m.test(text)) score += 20;

    // 4. Complexity / Steps
    // If we detected multiple steps/paragraphs, it's likely more reasoned.
    if (stepCount >= 3) score += 20;

    // Cap at 100
    score = Math.min(score, 100);

    return {
      score,
      passed: score >= 60,
      metadata: { mode, stepCount },
    };
  })
  .build();
