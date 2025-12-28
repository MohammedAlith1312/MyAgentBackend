import { buildScorer } from "@voltagent/core";
import {
    extractToolCalls,
    EvalPayload,
} from "./extractEvalData";

const GITHUB_TOOLS = ["github_issues", "github_update_issue", "github-sub-agent"];

export const githubLiveScorer = buildScorer({
    id: "github-action",
})
    .score(({ payload }: { payload: EvalPayload }) => {
        const toolCalls = extractToolCalls(payload);
        console.log("🎯 [githubLiveScorer] All tool calls:", toolCalls);

        // Filter for GitHub tools
        const ghCalls = toolCalls.filter((tc) => {
            console.log(`🔍 [githubLiveScorer] Checking tool call: ${tc.name}`, JSON.stringify(tc.args));
            if (GITHUB_TOOLS.includes(tc.name)) return true;
            if (tc.name === "delegate_task") {
                const args = tc.args || {};
                const targets = args.targetAgents || args.targets || [];
                console.log(`🔍 [githubLiveScorer] Delegate targets:`, JSON.stringify(targets));
                const match = Array.isArray(targets)
                    ? targets.some(t => String(t).includes("github"))
                    : String(targets).includes("github");
                console.log(`🔍 [githubLiveScorer] Match result for github: ${match}`);
                return match;
            }
            return false;
        });
        console.log("🎯 [githubLiveScorer] GitHub tool calls count:", ghCalls.length);
        console.log("🎯 [githubLiveScorer] GitHub tool calls:", ghCalls);

        if (ghCalls.length === 0) {
            console.log("⚠️ [githubLiveScorer] No GitHub tools detected, returning skipped");
            return {
                score: 0,
                passed: false,
                metadata: { status: "skipped", reason: "no_github_tool_called" },
            };
        }

        const call = ghCalls[0];

        // Handle delegation
        if (call.name === "delegate_task") {
            return {
                score: 70,
                passed: true,
                metadata: { tool: "delegate_task", target: "github-sub-agent" },
            };
        }

        const args = call.args || {};
        let params: any = args;

        if (typeof args === "string") {
            try {
                params = JSON.parse(args);
            } catch (e) {
                return {
                    score: 0,
                    passed: false,
                    metadata: { error: "json_parse_failed", args },
                };
            }
        }

        let score = 0;
        const isUpdate = call.name === "github_update_issue";

        // Extract repository info for delegate_task fallback
        if (!params.owner || !params.repo) {
            const repoStr = params.repository || params.context?.repository || params.task;
            if (typeof repoStr === 'string' && repoStr.includes('/')) {
                const [o, r] = repoStr.split('/');
                params.owner = params.owner || o;
                params.repo = params.repo || r;
            }
        }

        // Base Pass: Called correct tool with Owner/Repo (Critical for all GH tools)
        // Note: owner/repo are z.string(), so just checking existence.
        if (params.owner && params.repo) {
            score += 50;
        }

        if (isUpdate) {
            // Update specific logic
            // Needs issueNumber AND (state OR title OR body)
            const hasId = params.issueNumber || params.issue_number;
            const hasAction = params.state || params.title || params.body;

            if (hasId) score += 30;
            if (hasAction) score += 20;
        } else {
            // List/Get logic
            // Only needs owner/repo really for list, or issueNumber for get.
            // If we got owner/repo (50), that's a good start.
            // Let's just say if it's a valid list request, we give full marks?
            // Actually, let's bump score if no obvious errors.
            score += 50;
        }

        return {
            score,
            passed: score >= 80, // Needs most fields correct
            metadata: {
                tool: call.name,
                params: Object.keys(params), // logging which params were found
            },
        };
    })
    .build();
