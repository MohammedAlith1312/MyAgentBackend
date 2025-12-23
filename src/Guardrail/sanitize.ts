import { createInputGuardrail } from "@voltagent/core";

export const sanitizeGuardrail = createInputGuardrail({
  id: "sanitize-input",
  name: "Sanitize User Input",
  description: "Removes email addresses, phone numbers and URLs from user input.",

  handler: async ({ inputText }) => {
    console.log("[GUARDRAIL:sanitize] input =", inputText);
    if (!inputText) return { pass: true };

    let sanitized = inputText;
    sanitized = sanitized.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      "[email]"
    );
    sanitized = sanitized.replace(/\b\d{10,}\b/g, "[phone]");
    sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, "[url]");

    if (sanitized === inputText) {
      return { pass: true };
    }

    return {
      pass: true,
      action: "modify",
      modifiedInput: sanitized,
      message:
        "For your safety, email addresses,phone numbers and website links were automatically removed from your message.",
      metadata: {
        // originalLength: inputText.length,
        // sanitizedLength: sanitized.length,
        reason: "privacy_protection",
      },
    };
  },
});
