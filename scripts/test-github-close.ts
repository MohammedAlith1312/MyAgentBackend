
import "dotenv/config";
import { updateIssue, listIssues } from "../src/githubservice";
import { connectMcp, mcpClient } from "../src/mcpClient";

async function main() {
    console.log("🧪 Testing GitHub Issue Closing manually...");

    await connectMcp();

    const owner = "MohammedAlith1312";
    const repo = "MyAgentBackend";
    const issueNumber = 3; // The issue from the user's request

    console.log(`\n📋 First, checking status of issue #${issueNumber}...`);
    // Get current state
    const issues = await mcpClient.callTool({
        name: "list_issues",
        arguments: { owner, repo, state: "all" },
    });

    // Parse list result to find our issue
    // (Assuming list_issues returns a text block with JSON or similar)
    console.log("Reasoning: We need to see what 'list_issues' actually returns to parse it.");
    const content = (issues?.content as any)?.[0]?.text;
    console.log("RAW LIST RESULT:", content?.slice(0, 500)); // Print first 500 chars

    console.log(`\n🔒 Now attempting to CLOSE issue #${issueNumber}...`);
    try {
        const result = await updateIssue({
            owner,
            repo,
            issue_number: issueNumber,
            state: "closed"
        });
        console.log("✅ updateIssue returned:", JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error("❌ updateIssue FAILED:", err);
    }

    console.log("\n📋 Checking status again...");
    const issuesAfter = await mcpClient.callTool({
        name: "list_issues",
        arguments: { owner, repo, state: "all" },
    });
    const contentAfter = (issuesAfter?.content as any)?.[0]?.text;
    console.log("RAW LIST RESULT (After):", contentAfter?.slice(0, 500));

    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
