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

/* ---------------- Tools ---------------- */
import { weatherTool, calculatorTool, getLocationTool } from "./tools";

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
import { persistLiveEval } from "./evals/persistLiveEval";

/* ---------------- Scorers ---------------- */
import { logicalReasoningLiveScorer } from "./evals/reasoningLiveScorer";
import { mathLiveScorer } from "./evals/mathLiveScorer";

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

import { createGithubSubAgent } from "./subagent";

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

export const sendEmailTool = createSendEmailTool(
  voltops,
  process.env.CREDENTIAL_ID!
);

export const agent = new Agent({
  name: "sample-app",

  model: openrouter.chat("qwen/qwen3-coder:free"),

  memory,

  subAgents: [createGithubSubAgent()],

  tools: [
    withToolTelemetry(weatherTool),
    withToolTelemetry(calculatorTool),
    withToolTelemetry(getLocationTool),
    withToolTelemetry(sendEmailTool),
  ],

  inputGuardrails: [
    withInputGuardrailTelemetry(blockWordsGuardrail, "block-words"),
    // withInputGuardrailTelemetry(sanitizeGuardrail, "sanitize"),
    withInputGuardrailTelemetry(validationGuardrail, "validation"),
  ],

  outputGuardrails: [
    withOutputGuardrailTelemetry(digitGuardrail, "digit"),
  ],
  instructions: `
You are a helpful AI assistant.

GENERAL:
- Answer clearly and directly.
- Do NOT mention tools, agents, or internal steps.

====================
EMAIL
====================
- If the user asks to send an email:
  - You have a 'send_email' tool.
  - ASK for missing details (to, subject, body) if not provided.
  - Execute the tool directly when you have all details.

====================
MATH
====================
- If the user asks a math question:
  - Use the calculator tool.
  - Return steps and final numeric answer.MATH POLICY (MANDATORY):

1. Decide math type:
   - SIMPLE → you MAY use your own knowledge
   - COMPLEX → you MUST use the calculator tool

2. SIMPLE math:
   - One operator
   - Small numbers
   - Show steps

3. COMPLEX math:
   - Multiple operators
   - Division or large numbers
   - ALWAYS use calculator tool
   - Show steps

Never skip steps.
Never guess.
  

====================
GITHUB ISSUES
====================

INTENT DETECTION:
- GitHub intent exists ONLY if the user explicitly mentions:
  - GitHub
  - repository / repo
  - issues
  - pull requests

DEFAULT BEHAVIOR:
- When GitHub intent is detected:
  - EXECUTE the requested tool DIRECTLY.
  - DO NOT fetch issues unless explicitly asked to "list" or "show".
  - DO NOT verify issue existence before acting.
  - DO NOT ask for confirmation.

LISTING:
- If the user does NOT ask to summarize:
  - List issues only.
  - Show issue number, title, and status.
  - No explanations.

SUMMARIZATION:
- Summarize ONLY if the user explicitly says:
  - summarize
  - summary
  - explain
  - details
  - what is issue #X about

- If summarization is requested:
  - Fetch issues first (always).
  - Then summarize the fetched data in plain English.

SINGLE ISSUE:
- If a specific issue number is mentioned:
  - Fetch that issue.
  - If NOT asked to summarize → show basic info only.
  - If asked to summarize → explain that issue clearly.

DO NOT:
- Infer intent
- Summarize without data
- Return empty responses
`,

  /* ---------------- LIVE EVAL CONFIG ---------------- */
  eval: {
    triggerSource: "production",
    environment: "backend-api",
    sampling: { type: "ratio", rate: 1 },

    scorers: {
      math: {
        scorer: mathLiveScorer,
        onResult: async (result) => {
          const score = result.score ?? 0;

          await persistLiveEval({
            scorerId: "math-reasoning",
            score,
            passed: score >= 60, // ✅ FIX
            metadata: {
              ...result.metadata,
              conversationId: result.payload?.conversationId ?? null,
            },
          });
        },
      },

      logical: {
        scorer: logicalReasoningLiveScorer,
        onResult: async (result) => {
          const score = result.score ?? 0;

          await persistLiveEval({
            scorerId: "logical-reasoning",
            score,
            passed: score >= 60, // ✅ FIX
            metadata: {
              ...result.metadata,
              conversationId: result.payload?.conversationId ?? null,
            },
          });
        },
      },
    },
  },

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

console.log(`🚀 Server running on port ${PORT}`);