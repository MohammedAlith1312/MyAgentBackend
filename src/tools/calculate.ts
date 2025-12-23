import { createTool } from "@voltagent/core";
import { z } from "zod";
import { evaluate } from "mathjs";

export const calculatorTool = createTool({
  name: "calculate",
  description: "Evaluate a full arithmetic expression",

  parameters: z.object({
    expression: z.string(),
  }),

  execute: async ({ expression }) => {
    const result = evaluate(expression);
    return { result };
  },
});
