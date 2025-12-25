import { logicalReasoningLiveScorer } from "./src/evals/reasoningLiveScorer";
import { gmailLiveScorer } from "./src/evals/gmailLiveScorer";
import { githubLiveScorer } from "./src/evals/githubLiveScorer";

async function runTests() {
    console.log("🧪 Running Scorer Verification Tests...\n");

    // --- Test 1: Logical Reasoning with Tool Call ---
    console.log("🔹 Test 1: Logical Reasoning - Tool Call (Should Pass)");
    const logicalPayload = {
        output: "", // Text might be empty if just tool call
        metadata: {
            toolCalls: [{ name: "send_email", arguments: "{}" }],
        },
    };
    // Mocking the result wrapper because buildScorer returns an object with .score()
    const logicalResult = await (logicalReasoningLiveScorer as any).score({ payload: logicalPayload });
    // Note: The buildScorer return type in this codebase structure seems to be the scorer definition?
    // Actually, checking how it's used elsewhere, let's just inspect the logic source or usage.
    // Wait, buildScorer output usually needs to be run.
    // Let's assume the scorers exported are the "scorer" objects that have a .score() method or similar.
    // If not, I'll adjust. Based on previous file reads, it seems they are objects.

    // Correction: The `buildScorer(...).score(...)` pattern usually returns an object that HAS the logic inside.
    // But wait, the previous code was `.score(...).build()`. So the export IS the built thing.
    // Standard AgentOps/VoltAgent scorers often need to be "run". 
    // Let's try to infer from `scorers.ts`.
    // `scorers.ts` passes them to `createScorerConfig`.
    // Let's try calling it directly if it exposes the method.

    // Actually, for this simple script, I will just manually replicate what the `score` function inside does 
    // OR I can just import the files and run them if they allow.
    // Since they are built scorers, they *should* be callable or have a method.
    // Let's print one to see its structure if I can, but I can't interactively.

    // Let's assume standard interface: `scorer.score(payload)`. 
    // Or since `buildScorer` from `@voltagent/core` is used, it might be an async function itself?
    // Let's try invoking it or looking for a .score method.

    try {
        // @ts-ignore
        const res = await logicalReasoningLiveScorer({ payload: logicalPayload });
        console.log("Result:", res);
    } catch (e) {
        console.log("Direct call failed, trying .score()");
        // @ts-ignore
        // const res2 = await logicalReasoningLiveScorer.score({ payload: logicalPayload });
        // console.log("Result:", res2);
    }
}

// Rewriting test to be more robust based on codebase patterns.
// Modify verify to just import the functions content logic if simpler,
// OR better: use the `extractEvalData` helpers and generic invoke.

// New plan: better verification script.
