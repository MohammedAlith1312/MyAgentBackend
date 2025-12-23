import { buildScorer } from "@voltagent/core";

export const mathLiveScorer = buildScorer({
  id: "math-reasoning-graded",
})
  .score(({ payload }) => {
    const output = payload?.outputText;

    if (typeof output !== "string") {
      return { score: 0, passed: false };
    }

    const text = output.trim();

    /* ----------------------------
       Hard failure checks
    ----------------------------- */

    const hasAnyMath =
      /\d/.test(text) && /[+\-*/=]/.test(text);

    if (!hasAnyMath) {
      return {
        score: 0,
        passed: false,
        metadata: { reason: "no_math_detected" },
      };
    }

    /* ----------------------------
       Structure detection
    ----------------------------- */

    const hasSteps = /steps:/i.test(text);
    const hasAnswer = /answer:/i.test(text);

    const stepLines = text
      .split("\n")
      .filter(
        (l) =>
          l.trim() &&
          !/steps:/i.test(l) &&
          !/answer:/i.test(l)
      );

    const stepCount = stepLines.length;

    /* ----------------------------
       Scoring logic
    ----------------------------- */

    let score = 0;

    // Simple calculation, no steps
    if (!hasSteps && hasAnyMath) {
      score = 30;
    }

    // Steps exist but weak
    if (hasSteps && stepCount >= 1) {
      score = 40;
    }

    // Partial steps (2–3 lines)
    if (hasSteps && stepCount >= 2) {
      score = 60;
    }

    // Strong solution
    if (hasSteps && hasAnswer && stepCount >= 3) {
      score = 80;
    }

    // Full step-wise solution
    if (hasSteps && hasAnswer && stepCount >= 4) {
      score = 100;
    }

    return {
      score,
      passed: score >= 60,
      metadata: {
        hasSteps,
        hasAnswer,
        stepCount,
      },
    };
  })
  .build();
