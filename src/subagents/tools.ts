import { Agent } from "@voltagent/core";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { weatherTool, calculatorTool, getLocationTool } from "../tools";
import { withToolTelemetry } from "../telemetry/withToolTelemetry";

export function createToolSubAgent() {
    const model = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY!,
    });

    return new Agent({
        name: "tool-sub-agent",
        model: model.chat("nvidia/nemotron-nano-12b-v2-vl:free"),
        tools: [
            withToolTelemetry(weatherTool),
            withToolTelemetry(calculatorTool),
            withToolTelemetry(getLocationTool),
        ],
        instructions: `
You are the Tool Execution Subagent.
Your ONLY purpose is to use the available tools to answer the user's request.
- If the user asks for Weather, use the weather tool.
- If the user asks for Calculation, use the calculator tool.
- If the user asks for Location, use the location tool.

Do not engage in general conversation unless it is to explain the tool output.
`,
    });
}
