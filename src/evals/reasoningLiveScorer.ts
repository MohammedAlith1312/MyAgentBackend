import { buildScorer } from "@voltagent/core";

export const logicalReasoningLiveScorer = buildScorer({
  id: "logical-reasoning-100",
})
  .score(({ payload }) => {
    if (typeof payload?.output !== "string") {
      return { score: 0, passed: false };
    }

    const text = payload.output.toLowerCase();
    let score = 0;

    if (/because|therefore|thus/.test(text)) score += 40;
    if (text.length > 20) score += 40;

    score = Math.min(score, 100);

    return {
      score,
      passed: score >= 60,
      metadata: { length: text.length },
    };
  })
  .build();
