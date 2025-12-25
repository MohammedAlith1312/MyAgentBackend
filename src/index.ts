import "dotenv/config";
import {
  VoltAgent,
  Agent,
  Memory,
  VoltOpsClient,
} from "@voltagent/core";
import { AgentEvalResult } from "./types";
import { PostgreSQLMemoryAdapter } from "@voltagent/postgres";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { honoServer } from "@voltagent/server-hono";

/* ---------------- Subagents ---------------- */
import { createGithubSubAgent } from "./subagents/github";
import { createReasoningSubAgent } from "./subagents/chat";
import { createToolSubAgent } from "./subagents/tools";
import { createEmailSubAgent } from "./subagents/email";


/* ---------------- Guardrails ---------------- */
import { blockWordsGuardrail } from "./Guardrail/words";
import { sanitizeGuardrail } from "./Guardrail/sanitize";
import { validationGuardrail } from "./Guardrail/validation";
import { digitGuardrail } from "./Guardrail/digitts";

/* ---------------- Gmail ---------------- */
import { registerGmailTrigger } from "./triggers/gmail";
import { gmailGetLatestEmailWorkflow } from "./actions/gmail";
import { createSendGmailWorkflow, createSendEmailTool } from "./actions/sendmail";

/* ---------------- Routes ---------------- */
import { conversationsRoute } from "./routes/conversation";
import { historyRoute } from "./routes/history";
import { chatRoute } from "./routes/chat";
import { deleteConversationRoute } from "./routes/conversationdelete";
import { getEmailsRoute } from "./routes/getmail";
import { sendEmailRoute } from "./routes/sendmail";
import { getLiveEvalsRoute } from "./routes/eval";

/* ---------------- Live Eval DB ---------------- */
import { initLiveEvalTable } from "./db/live-eval";

/* ---------------- Scorers ---------------- */
import { liveEvalConfig } from "./subagents/scorers";

/* ---------------- Telemetry ---------------- */
import { withToolTelemetry } from "./telemetry/withToolTelemetry";
import {
  withInputGuardrailTelemetry,
  withOutputGuardrailTelemetry,
} from "./telemetry/withGuardrailTelemetry";
import { initTelemetryTable } from "./db/telemetry";
import { telemetryToolsRoute } from "./routes/telemetry-tools";
// import { telemetryGuardrailsRoute } from "./routes/telemetry-guardrails";

import { listIssuesRoute, issueDetailRoute } from "./routes/github";
import { mcpHealthRoute } from "./routes/health";


/* ======================================================
   Init DB
   ====================================================== */

await initTelemetryTable();
await initLiveEvalTable();

/* ======================================================
   OpenRouter
   ====================================================== */

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

/* ======================================================
   Memory
   ====================================================== */

export const memory = new Memory({
  storage: new PostgreSQLMemoryAdapter({
    connection: process.env.DATABASE_URL!,
  }),
});

/* ======================================================
   VoltOps
   ====================================================== */

const voltops = new VoltOpsClient({
  publicKey: process.env.VOLTAGENT_PUBLIC_KEY!,
  secretKey: process.env.VOLTAGENT_SECRET_KEY!,
});

export const sendGmailWorkflow = createSendGmailWorkflow(
  voltops,
  process.env.CREDENTIAL_ID!
);

// Note: sendEmailTool is used in EmailSubAgent now

export const agent = new Agent({
  name: "sample-app",

  model: openrouter.chat("xiaomi/mimo-v2-flash:free"),

  // Disable streaming to support tools with this provider


  memory,

  // ROUTER CONFIGURATION
  subAgents: [
    createGithubSubAgent(),
    createReasoningSubAgent(),
    createToolSubAgent(),
    createEmailSubAgent(voltops, process.env.CREDENTIAL_ID!),

  ],

  // Main agent interacts via subagents, no direct tools ideally, 
  // but we can keep basic ones if needed. For this task, strict routing is requested.
  tools: [],

  inputGuardrails: [
    withInputGuardrailTelemetry(blockWordsGuardrail, "block-words"),
    // withInputGuardrailTelemetry(sanitizeGuardrail, "sanitize"),
    withInputGuardrailTelemetry(validationGuardrail, "validation"),
  ],

  outputGuardrails: [
    withOutputGuardrailTelemetry(digitGuardrail, "digit"),
  ],
  instructions: `
You are a Dynamic Agent Assistant.
Your Main Role is to ROUTE requests to the appropriate Sub-Agent.

AVAILABLE SUB-AGENTS:
1. **reasoning-sub-agent**: Handles Logical Reasoning and Math.
   - Use for logical questions, riddles, analysis.
   - Use for Math ONLY if explicitly requested.

2. **tool-sub-agent**: Handles specific Tool Calls.
   - Use ONLY if the user explicitly wants to use a tool like Weather, Calculator, or Location.
   - If User says "Calculate...", usually prefer tool-sub-agent if it involves numbers.

3. **github-sub-agent**: Handles GitHub Issues.
   - Use for querying, listing, or updating GitHub issues.

4. **email-sub-agent**: Handles Emails.
   - Use for sending or managing emails.



ROUTING RULES:
- Analyze the user's prompt carefully.
- Delegate the task completely to the sub-agent.
- Do NOT attempt to answer questions directly if they fall into the above categories.
- If the user's intent is unclear, ask for clarification.
`,

  /* ---------------- LIVE EVAL CONFIG ---------------- */
  eval: liveEvalConfig,

});

/* ======================================================
   Server Startup
   ====================================================== */

const USER_ID = "mohammed-alith";
const PORT = Number(process.env.PORT) || 5000;

registerGmailTrigger(gmailGetLatestEmailWorkflow);

new VoltAgent({
  agents: { "sample-app": agent },

  workflows: {
    "send-gmail-workflow": sendGmailWorkflow,
    "gmail-get-latest-email": gmailGetLatestEmailWorkflow,
  },

  server: honoServer({
    port: PORT,
    configureApp(app) {
      app.post("/api/chat", chatRoute({ agent, USER_ID, memory }));

      app.get("/api/conversations", conversationsRoute({ memory, USER_ID }));
      app.get(
        "/api/conversations/:conversationId/history",
        historyRoute({ memory, USER_ID })
      );
      app.delete(
        "/api/conversations/:conversationId",
        deleteConversationRoute({ memory, USER_ID })
      );

      app.get("/api/emails", getEmailsRoute({ gmailGetLatestEmailWorkflow, USER_ID }));
      app.post("/api/emails/send", sendEmailRoute({ sendGmailWorkflow, USER_ID }));

      app.get("/api/evals/live", getLiveEvalsRoute());

      app.get("/api/telemetry/tools", telemetryToolsRoute());
      // app.get("/api/telemetry/guardrails", telemetryGuardrailsRoute());
      app.get("/api/health/mcp", mcpHealthRoute);
      app.get("/api/github/issues", listIssuesRoute);
      app.get("/api/github/issues/:id", issueDetailRoute);
    },
  }),
});

