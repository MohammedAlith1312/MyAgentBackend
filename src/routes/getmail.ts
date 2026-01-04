import type { Context } from "hono";
import { VoltOpsClient } from "@voltagent/core";
import { saveEmail, getEmailsFromDb } from "../db/emails";

export function getEmailsRoute(deps: {
  gmailGetLatestEmailWorkflow: {
    run: (input: {
      userId: string;
      conversationId: string;
    }) => Promise<any>;
  };
  USER_ID: string;
}) {
  const voltops = new VoltOpsClient({
    publicKey: process.env.VOLTAGENT_PUBLIC_KEY!,
    secretKey: process.env.VOLTAGENT_SECRET_KEY!,
  });

  return async (c: Context) => {
    // Default to 'sent' as requested by user
    const type = (c.req.query("type") as "inbox" | "sent") || "sent";

    // Testing basic connectivity without date filter first
    const query = type === "sent" ? "label:SENT" : "in:inbox";
    const maxResults = 25;

    console.log(`[GetEmails] Entering route for type: ${type}`);
    console.log(`[GetEmails] Fetching ${type} with query '${query}'...`);

    try {
      // 1. Fetch search results from Gmail
      console.log("[GetEmails] Calling searchEmail...");
      const searchResult = await voltops.actions.gmail.searchEmail({
        credential: {
          credentialId: process.env.CREDENTIAL_ID!,
        },
        query,
        maxResults,
      });

      console.log("[GetEmails] searchEmail returned.");
      const rawResult = searchResult as any;

      // Robust parsing: check standard Gmail API output and potential wrappers
      const messages =
        rawResult.messages ||
        rawResult.data?.messages ||
        rawResult.payload?.messages ||
        [];

      console.log(`[GetEmails] Messages found via parsing: ${messages.length}`);

      if (messages.length === 0) {
        console.log("[GetEmails] No messages found from API. Fallback to DB.");
        const dbMessages = await getEmailsFromDb(type, maxResults);
        return c.json({ messages: dbMessages });
      }

      // 2. Fetch details for each email
      const detailedMessages = await Promise.all(
        messages.map(async (msg: any) => {
          try {
            const emailResult = await voltops.actions.gmail.getEmail({
              credential: {
                credentialId: process.env.CREDENTIAL_ID!,
              },
              messageId: msg.id,
              format: "full", // Changed to full to get body
            });

            const email = emailResult as any;
            const headers = email.payload?.headers ?? [];
            const from = headers.find((h: any) => h.name === "From")?.value ?? "Unknown";
            const to = headers.find((h: any) => h.name === "To")?.value ?? "Unknown";
            const subject = headers.find((h: any) => h.name === "Subject")?.value ?? "(No Subject)";
            const date = headers.find((h: any) => h.name === "Date")?.value ?? "";

            // Helper to extract body and attachments from parts
            let body = "";
            let attachments: { filename: string, content: string, type: string }[] = [];

            if (email.payload?.body?.data) {
              body = Buffer.from(email.payload.body.data, 'base64').toString('utf-8');
            } else if (email.payload?.parts) {
              const processParts = (parts: any[]) => {
                let textBody = "";
                let htmlBody = "";

                for (const part of parts) {
                  if (part.filename && part.filename.length > 0) {
                    // It's an attachment
                    attachments.push({
                      filename: part.filename,
                      content: "", // valid for metadata listing, content is on demand
                      type: part.mimeType
                    });
                  } else {
                    if (part.mimeType === "text/plain" && part.body?.data) {
                      textBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
                    } else if (part.mimeType === "text/html" && part.body?.data) {
                      htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
                    } else if (part.parts) {
                      const { text, html } = processParts(part.parts);
                      if (text) textBody = text;
                      if (html) htmlBody = html;
                    }
                  }
                }
                return { text: textBody, html: htmlBody };
              };

              const { text, html } = processParts(email.payload.parts);
              body = text || html;
            }
            // Fallback to snippet if body extraction fails
            if (!body) body = email.snippet || "";

            const emailObj = {
              id: msg.id,
              threadId: msg.threadId,
              snippet: email.snippet || "",
              from,
              to,
              subject,
              body,
              date,
              status: type === 'sent' ? 'EMAIL_SENT' : 'RECEIVED',
              attachments
            };

            // 3. Sync to DB
            await saveEmail({
              messageId: emailObj.id,
              threadId: emailObj.threadId,
              from: emailObj.from,
              to: emailObj.to,
              subject: emailObj.subject,
              body: emailObj.body, // Store full body
              snippet: emailObj.snippet,
              type: type,
              attachments: emailObj.attachments
            });

            return emailObj;
          } catch (e) {
            console.error(`Failed to fetch/sync email ${msg.id}`, e);
            return null;
          }
        })
      );

      const validMessages = detailedMessages.filter((m) => m !== null);
      return c.json({ messages: validMessages });

    } catch (error: any) {
      console.error("Get emails error:", error);
      // Fallback to local DB on API failure
      try {
        const dbMessages = await getEmailsFromDb(type, maxResults);
        return c.json({ messages: dbMessages });
      } catch (dbError) {
        return c.json({ messages: [] });
      }
    }
  };
}
