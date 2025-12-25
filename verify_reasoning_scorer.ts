
import { logicalReasoningLiveScorer } from "./src/evals/reasoningLiveScorer";

async function runTest() {
    console.log("Starting Reasoning Scorer Verification...");

    const testCases = [
        {
            input: "Strapi is a headless CMS.",
            minScore: 0, maxScore: 40,
            expectedDesc: "Short factual statement (Low Score)"
        },
        {
            input: "Strapi is useful because it provides a flexible API and separates content from presentation.",
            minScore: 50, maxScore: 100,
            expectedDesc: "Explanation with 'because' (High Score)"
        },
        {
            input: "1. Install Node.js\n2. Run npm install\n3. Start the server",
            minScore: 40, maxScore: 100,
            expectedDesc: "Structured list (Medium/High Score)"
        },
        {
            input: "I think it is good.",
            minScore: 0, maxScore: 30,
            expectedDesc: "Short opinion (Low Score)"
        }
    ];

    for (const test of testCases) {
        const payload = {
            output: test.input,
            metadata: { toolCalls: [] },
        };

        console.log(`\nTesting input: "${test.input}"`);
        console.log(`  Expected: ${test.expectedDesc}`);

        try {
            // @ts-ignore
            const result = await logicalReasoningLiveScorer.score({ payload });
            const score = result.score ?? 0;

            console.log(`  Actual Score: ${score}`);

            if (score >= test.minScore && score <= test.maxScore) {
                console.log("  ✅ PASS");
            } else {
                console.log(`  ❌ FAIL (Expected between ${test.minScore} and ${test.maxScore})`);
            }

        } catch (e) {
            console.error("  Error running scorer:", e);
        }
    }
}

runTest();
