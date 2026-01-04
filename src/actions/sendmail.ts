import { createWorkflowChain, createTool, type VoltOpsClient, type ToolExecuteOptions } from "@voltagent/core";
import { saveEmail } from "../db/emails";
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
      attachments: z.array(z.object({
        filename: z.string(),
        content: z.string(), // Base64
        type: z.string(),
      })).optional(),
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
          // @ts-ignore - Assuming lib supports this or we simply pass it through
          attachments: data.attachments,
        });

        await saveEmail({
          from: 'Me', // Default for sent items
          to: data.to,
          subject: data.subject,
          body: data.body,
          type: 'sent',
          snippet: data.body.substring(0, 100),
          attachments: data.attachments?.map(a => ({
            filename: a.filename,
            content: a.content, // Consider size limit here?
            type: a.type
          }))
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

        await saveEmail({
          from: 'me',
          to: args.to,
          subject: args.subject,
          body: args.body,
          type: 'sent',
          snippet: args.body.substring(0, 100)
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
