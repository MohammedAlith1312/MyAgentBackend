import { Agent } from "@voltagent/core";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { liveEvalConfig } from "./scorers";



export function createReasoningSubAgent() {
    const model = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY!,
    });

    return new Agent({
        name: "chat-sub-agent",
        model: model.chat("nvidia/nemotron-nano-12b-v2-vl:free"),

        instructions: `
You are a helpful AI assistant.
Your goal is to provide clear, accurate, and helpful responses.
You can engage in general conversation, answer questions, and provide explanations naturally.
`,
        eval: liveEvalConfig
    });
}
