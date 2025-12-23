import { buildScorer } from "@voltagent/core";

export const logicalReasoningLiveScorer = buildScorer({
  id: "logical-reasoning-graded",
})
  .score(({ payload }) => {
    const output = payload?.outputText;

    /* ----------------------------
       Hard failure
    ----------------------------- */

    if (typeof output !== "string") {
      return { score: 0, passed: false };
    }

    const text = output.toLowerCase().trim();

    if (text.length < 5) {
      return {
        score: 0,
        passed: false,
        metadata: { reason: "too_short" },
      };
    }

    /* ----------------------------
       Feature detection
    ----------------------------- */

    const reasoningWords =
      /(because|therefore|thus|hence|as a result|so that)/.test(text);

    const logicalStructure =
      /(if .* then|since .*[,]|given that|due to|leads to)/.test(text);

    const explanationSignals =
      /(this means|which implies|in order to|explains why)/.test(text);

    const contentRichness =
      text.split(/\s+/).length > 12;

    /* ----------------------------
       Length scoring
    ----------------------------- */

    let lengthScore = 0;
    if (text.length > 120) lengthScore = 25;
    else if (text.length > 60) lengthScore = 15;
    else if (text.length > 30) lengthScore = 10;

    /* ----------------------------
       Total scoring
    ----------------------------- */

    let score = 0;

    if (reasoningWords) score += 30;
    if (logicalStructure) score += 30;
    if (explanationSignals) score += 15;
    if (contentRichness) score += 10;

    score += lengthScore;

    score = Math.min(score, 100);

    return {
      score,
      passed: score >= 60,
      metadata: {
        length: text.length,
        reasoningWords,
        logicalStructure,
        explanationSignals,
        contentRichness,
      },
    };
  })
  .build();
