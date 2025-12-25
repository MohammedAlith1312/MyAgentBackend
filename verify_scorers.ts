import { logicalReasoningLiveScorer } from "./src/evals/reasoningLiveScorer";
import { gmailLiveScorer } from "./src/evals/gmailLiveScorer";
import { githubLiveScorer } from "./src/evals/githubLiveScorer";

import * as fs from 'fs';

async function runTests() {
    const logFile = "verify_output.txt";
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + "\n");
    };
    // Clear file
    fs.writeFileSync(logFile, "🧪 Running Scorer Verification Tests...\n\n");

    log("🧪 Running Scorer Verification Tests...\n");

    const scorers = {
        logical: logicalReasoningLiveScorer,
        gmail: gmailLiveScorer,
        github: githubLiveScorer,
    };

    log("Scorer types:");
    for (const [key, scorer] of Object.entries(scorers)) {
        log(`- ${key}: ${typeof scorer} (Is array? ${Array.isArray(scorer)})`);
        // Check for common methods
        // @ts-ignore
        log(`  - Has .score method? ${typeof scorer.score === 'function'}`);
        // @ts-ignore
        log(`  - Has .run method? ${typeof scorer.run === 'function'}`);
    }

    // Helper to run a scorer
    async function runScorer(name: string, scorer: any, payload: any) {
        log(`\n🔹 Testing ${name}...`);
        try {
            let result;
            // Try calling as function first (common pattern if it's a built executable)
            if (typeof scorer === 'function') {
                result = await scorer({ payload });
            }
            // Try .score method
            else if (scorer.score && typeof scorer.score === 'function') {
                result = await scorer.score({ payload });
            }
            // Try .run method
            else if (scorer.run && typeof scorer.run === 'function') {
                result = await scorer.run({ payload });
            }
            else {
                throw new Error("Unknown scorer interface");
            }
            log(`✅ ${name} Result: ${JSON.stringify(result, null, 2)}`);
        } catch (e: any) {
            log(`❌ ${name} Failed: ${e.message}`);
        }
    }

    // 1. Logical Reasoning (Tool Based)
    await runScorer("Logical Reasoning (Tool)", scorers.logical, {
        output: "Sent email.",
        metadata: { toolCalls: [{ name: "send_email", arguments: "{}" }] },
    });

    // 2. Gmail (Valid)
    await runScorer("Gmail (Valid)", scorers.gmail, {
        metadata: {
            toolCalls: [{
                name: "send_email",
                arguments: JSON.stringify({ to: "test@test.com", subject: "Hi", body: "Hello" })
            }]
        },
    });

    // 3. Gmail (Invalid)
    await runScorer("Gmail (Invalid)", scorers.gmail, {
        metadata: {
            toolCalls: [{
                name: "send_email",
                arguments: JSON.stringify({ to: "" }) // Missing subject/body
            }]
        },
    });

    // 4. GitHub (Valid List)
    await runScorer("GitHub (List)", scorers.github, {
        metadata: {
            toolCalls: [{
                name: "github_issues",
                arguments: JSON.stringify({ owner: "foo", repo: "bar" })
            }]
        },
    });

}

runTests().catch(console.error);
