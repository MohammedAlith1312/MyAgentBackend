import { buildScorer } from "@voltagent/core";

export const mathLiveScorer = buildScorer({
  id: "math-reasoning-100",
})
  .score(({ payload }) => {
    if (typeof payload?.output !== "string") {
      return { score: 0, passed: false };
    }

    const hasMath = /\d/.test(payload.output) && /[+\-*/=]/.test(payload.output);

    return {
      score: hasMath ? 80 : 0,
      passed: hasMath,
      metadata: { hasMath },
    };
  })
  .build();
