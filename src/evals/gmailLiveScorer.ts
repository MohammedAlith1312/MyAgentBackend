import { buildScorer } from "@voltagent/core";
import {
    extractToolCalls,
    EvalPayload,
} from "./extractEvalData";

const GMAIL_TOOL_NAMES = ["send_email", "email-sub-agent"];

export const gmailLiveScorer = buildScorer({
    id: "gmail-eval",
})
    .score(({ payload }: { payload: EvalPayload }) => {
        const toolCalls = extractToolCalls(payload);

        // Filter for our specific tools
        const emailCalls = toolCalls.filter((tc) => {
            if (GMAIL_TOOL_NAMES.includes(tc.name)) return true;
            if (tc.name === "delegate_task") {
                const targets = tc.args?.targetAgents || [];
                return targets.includes("email-sub-agent");
            }
            return false;
        });

        if (emailCalls.length === 0) {
            return {
                score: 0,
                passed: false, // Not relevant if tool wasn't called? Or handled by skip logic.
                metadata: { status: "skipped", reason: "no_email_tool_called" },
            };
        }

        // We found at least one email call. Let's validate the first one.
        // Ideally, we'd validate all, but for "live" scoring, checking the primary action is good.
        const call = emailCalls[0];
        const args = call.args || {}; // arguments might be a JSON string or object

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
