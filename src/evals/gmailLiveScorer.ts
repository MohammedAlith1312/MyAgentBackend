import { buildScorer } from "@voltagent/core";
import {
    extractToolCalls,
    EvalPayload,
} from "./extractEvalData";

const GMAIL_TOOL_NAMES = ["send_email", "email-sub-agent"];

export const gmailLiveScorer = buildScorer({
    id: "gmail-action",
})
    .score(({ payload }: { payload: EvalPayload }) => {
        const toolCalls = extractToolCalls(payload);
        console.log("🎯 [gmailLiveScorer] All tool calls:", toolCalls);

        // Filter for our specific tools
        const emailCalls = toolCalls.filter((tc) => {
            console.log(`🔍 [gmailLiveScorer] Checking tool call: ${tc.name}`, JSON.stringify(tc.args));
            if (GMAIL_TOOL_NAMES.includes(tc.name)) return true;
            if (tc.name === "delegate_task") {
                const args = tc.args || {};
                const targets = args.targetAgents || args.targets || [];
                console.log(`🔍 [gmailLiveScorer] Delegate targets:`, JSON.stringify(targets));
                const match = Array.isArray(targets)
                    ? targets.some(t => String(t).includes("email"))
                    : String(targets).includes("email");
                console.log(`🔍 [gmailLiveScorer] Match result for email: ${match}`);
                return match;
            }
            return false;
        });
        console.log("🎯 [gmailLiveScorer] Email tool calls count:", emailCalls.length);

        if (emailCalls.length === 0) {
            console.log("⚠️ [gmailLiveScorer] No Email tools detected, returning skipped");
            return {
                score: 0,
                passed: false,
                metadata: { status: "skipped", reason: "no_email_tool_called" },
            };
        }

        const call = emailCalls[0];

        // If it's a delegation call, we give a base score for correct routing
        if (call.name === "delegate_task") {
            return {
                score: 70,
                passed: true,
                metadata: { tool: "delegate_task", target: "email-sub-agent" },
            };
        }

        const args = call.args || {};

        // If it's a string, try to parse
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

        // Validation Criteria
        const checks = {
            hasTo: Boolean(params.to && params.to.length > 0),
            hasSubject: Boolean(params.subject && params.subject.length > 0),
            hasBody: Boolean(params.body && params.body.length > 0),
        };

        let score = 0;
        if (checks.hasTo) score += 40;
        if (checks.hasSubject) score += 30;
        if (checks.hasBody) score += 30;

        return {
            score,
            passed: score === 100,
            metadata: {
                tool: emailCalls[0].name,
                checks,
            },
        };
    })
    .build();
