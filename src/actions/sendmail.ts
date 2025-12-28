import { createWorkflowChain, createTool, type VoltOpsClient, type ToolExecuteOptions } from "@voltagent/core";
import { z } from "zod";

export function createSendGmailWorkflow(
  voltops: VoltOpsClient,
  credentialId: string
) {
  return createWorkflowChain({
    id: "send-gmail-workflow",
    name: "Send Gmail Email",
    purpose: "Send a single Gmail email via VoltOps",

    input: z.object({
      userId: z.string(),
      conversationId: z.string(),
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
    }),

    result: z.object({
      status: z.enum(["EMAIL_SENT", "FAILED"]),
      errorCode: z.string().optional(),
      errorMessage: z.string().optional(),
    }),
  }).andThen({
    id: "send-email",
    execute: async ({ data }) => {
      try {
        await voltops.actions.gmail.sendEmail({
          credential: { credentialId },
          to: data.to,
          subject: data.subject,
          textBody: data.body.replace(/\\n/g, "\n"),
        });

        return { status: "EMAIL_SENT" };
      } catch (err: any) {
        return {
          status: "FAILED",
          errorCode: err?.code ?? "GMAIL_SEND_FAILED",
          errorMessage: String(err?.message ?? err),
        };
      }
    },
  });
}

export function createSendEmailTool(
  voltops: VoltOpsClient,
  credentialId: string
) {
  return createTool({
    name: "send_email",
    description: "Send a single Gmail email via VoltOps",
    parameters: z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
    }),
    execute: async (args) => {
      try {
        await voltops.actions.gmail.sendEmail({
          credential: { credentialId },
          to: args.to,
          subject: args.subject,
          textBody: args.body.replace(/\\n/g, "\n"),
        });

        return { status: "EMAIL_SENT" };
      } catch (err: any) {
        return {
          status: "FAILED",
          errorCode: err?.code ?? "GMAIL_SEND_FAILED",
          errorMessage: String(err?.message ?? err),
        };
      }
    },
  });
}
