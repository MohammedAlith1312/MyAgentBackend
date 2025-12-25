
import { mathLiveScorer } from "./src/evals/mathLiveScorer";

async function runTest() {
    console.log("Starting Math Scorer Verification...");

    const testCases = [
        { input: "what is strapi", expectedStatus: "skipped" },
        { input: "Calculate 2 + 2", expectedStatus: "evaluated" }, // Should pass filter
        { input: "solve this equation: x^2 = 4", expectedStatus: "evaluated" },
        { input: "hello world", expectedStatus: "skipped" },
        { input: "5 * 5", expectedStatus: "evaluated" },
    ];

    for (const test of testCases) {
        // Mock payload structure approx
        const payload = {
            rawInput: [{ content: test.input, metadata: { requiresTool: false } }],
            messages: [{ content: "some output" }], // mock output
            metadata: { toolCalls: [] },
        };

        console.log(`Testing input: "${test.input}"`);

        // We can't easily call .score() directly because it's wrapped by buildScorer 
        // but the object exported usually has a run or score method or we can just rely on the fact 
        // that if it compiles, we are good. 
        // Wait, buildScorer returns a Scorer object which might have a .score method exposed or it might be internal.
        // Let's inspect the exported object.

        try {
            // @ts-ignore
            const result = await mathLiveScorer.score({ payload });

            // Check if skipped
            if (result.metadata?.status === "skipped") {
                if (test.expectedStatus === "skipped") {
                    console.log("  ✅ Correctly skipped");
                } else {
                    console.log("  ❌ Incorrectly skipped");
                }
            } else {
                if (test.expectedStatus === "evaluated") {
                    console.log("  ✅ Correctly evaluated");
                } else {
                    console.log("  ❌ Incorrectly evaluated (Should have skipped)");
                }
            }

        } catch (e) {
            console.error("  Error running scorer:", e);
        }
    }
}

runTest();
