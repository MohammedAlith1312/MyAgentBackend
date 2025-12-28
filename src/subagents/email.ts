import { Agent } from "@voltagent/core";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { liveEvalConfig } from "./scorers";
import { createSendEmailTool } from "../actions/sendmail";
import { VoltOpsClient } from "@voltagent/core";
import { withToolTelemetry } from "../telemetry/withToolTelemetry";

export function createEmailSubAgent(voltops: VoltOpsClient, credentialId: string) {
    const model = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const sendEmailTool = createSendEmailTool(voltops, credentialId);

    return new Agent({
        name: "email-sub-agent",
        model: model.chat("qwen/qwen3-coder:free"),
        tools: [
            withToolTelemetry(sendEmailTool)
        ],
        instructions: `
You are the Email Subagent.
Your responsibility is to handle email-related requests.
- Use the 'send_email' tool to send emails.
- If missing details (to, subject, body), ASK the user for them before sending.
`,
        eval: liveEvalConfig,
    });
}
