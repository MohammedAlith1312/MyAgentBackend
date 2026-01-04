import { Context } from "hono";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorAdapter, generateEmbedding } from "../lib/retriever";
import { createRequire } from "module";
import crypto from "crypto";

/* ------------------------------------------------------------------ */
/* pdf-parse CommonJS compatibility (Next.js 16 / Turbopack / ESM)     */
/* ------------------------------------------------------------------ */
// pdf-parse removed in favor of pdfjs-dist
// const require = createRequire(import.meta.url);

/* ------------------------------------------------------------------ */
/* Upload Route                                                        */
/* ------------------------------------------------------------------ */
export const uploadRoute = () => async (c: Context) => {
    try {
        const body = await c.req.parseBody();
        const file = body.file as File | undefined;

        /* ---------------- Validation ---------------- */
        if (!file || typeof file.arrayBuffer !== "function") {
            return c.json({ error: "No valid file uploaded" }, 400);
        }

        const filename = file.name?.toLowerCase() ?? "";
        const allowedExtensions = [".pdf", ".txt", ".md"];

        if (!allowedExtensions.some(ext => filename.endsWith(ext))) {
            return c.json(
                { error: "Only PDF, TXT, and MD files are supported" },
                400
            );
        }

        // Optional safety limit (10 MB)
        if (file.size > 10 * 1024 * 1024) {
            return c.json({ error: "File too large (max 10MB)" }, 400);
        }

        /* ---------------- Text Extraction ---------------- */
        const buffer = Buffer.from(await file.arrayBuffer());
        let text = "";

        if (filename.endsWith(".pdf")) {
            try {
                // Use pdfjs-dist for robust parsing (handles newer PDFs better than pdf-parse)
                // Using standard import path for modern environments
                // @ts-ignore
                const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");

                const loadingTask = getDocument({
                    data: new Uint8Array(buffer),
                    useSystemFonts: true, // Reduce dependencies on canvas/fonts
                    disableFontFace: true
                });

                const doc = await loadingTask.promise;
                const numPages = doc.numPages;
                const pageTexts: string[] = [];

                for (let i = 1; i <= numPages; i++) {
                    const page = await doc.getPage(i);
                    const content = await page.getTextContent();
                    // items has str property
                    const strings = content.items.map((item: any) => item.str);
                    pageTexts.push(strings.join(" "));
                }

                text = pageTexts.join("\n\n");
            } catch (pdfErr: any) {
                console.error("PDF Parse Error:", pdfErr);
                const msg = pdfErr?.message || String(pdfErr);

                if (msg.includes("Cannot find module 'pdfjs-dist")) {
                    throw new Error("PDF parser missing. Please run: npm install pdfjs-dist");
                }

                throw new Error(`Failed to parse PDF: ${msg}`);
            }
        } else {
            text = buffer.toString("utf-8");
        }

        if (!text.trim()) {
            return c.json({ error: "Failed to extract text from file" }, 400);
        }

        /* ---------------- Chunking ---------------- */
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const docs = await splitter.createDocuments([text]);

        if (docs.length === 0) {
            return c.json({ error: "No chunks created from document" }, 400);
        }

        /* ---------------- Embeddings (parallel) ---------------- */
        const records = await Promise.all(
            docs.map(async (doc) => ({
                id: crypto.randomUUID(),
                vector: await generateEmbedding(doc.pageContent),
                content: doc.pageContent,
                metadata: {
                    filename: file.name,
                    uploadedAt: new Date().toISOString(),
                },
            }))
        );

        /* ------------------------------------------------------------------
           PostgreSQLVectorAdapter REAL API
           ✔ insert() exists
           ✘ add() / upsert() do NOT exist
        ------------------------------------------------------------------ */
        const adapter = vectorAdapter as any;

        // Log available methods for debugging
        const prototype = Object.getPrototypeOf(adapter);
        const methods = Object.getOwnPropertyNames(prototype).filter(m => m !== 'constructor');
        console.log("Vector Adapter available methods:", methods);

        if (typeof adapter.storeBatch === "function") {
            // Map records to match expected format if needed, but assuming standard VectorRecord compatibility
            await adapter.storeBatch(records);
        } else if (typeof adapter.store === "function") {
            // Fallback to sequential store if batch not available (though it is)
            for (const record of records) {
                await adapter.store(record);
            }
        } else if (typeof adapter.insert === "function") {
            await adapter.insert(records);
        } else if (typeof adapter.add === "function") {
            await adapter.add(records);
        } else if (typeof adapter.upsert === "function") {
            await adapter.upsert(records);
        } else {
            throw new Error(`Vector adapter has no valid insert method. Available methods: ${methods.join(", ")}`);
        }

        /* ---------------- Response ---------------- */
        return c.json({
            success: true,
            filename: file.name,
            chunks: records.length,
        });

    } catch (err) {
        console.error("❌ Upload failed:", err);
        return c.json(
            {
                error: "Upload failed",
                details: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};
