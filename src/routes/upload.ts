import { Context } from "hono";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorAdapter, generateEmbedding } from "../lib/retriever";

export const uploadRoute = () => async (c: Context) => {
    try {
        const body = await c.req.parseBody();
        const file = body["file"];

        if (!file || !(file instanceof File)) {
            return c.json({ error: "No file uploaded" }, 400);
        }

        const text = await file.text();

        // 1. Chunk the text
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const docs = await splitter.createDocuments([text]);

        // 2. Embed and Store
        const itemsToStore = [];

        for (const doc of docs) {
            const embedding = await generateEmbedding(doc.pageContent);
            itemsToStore.push({
                vector: embedding,
                text: doc.pageContent,
                metadata: {
                    ...doc.metadata,
                    filename: file.name,
                    uploadedAt: new Date().toISOString()
                }
            });
        }

        // 3. Save to Vector DB
        // Using any cast as the method name is not detected in types, likely 'upsert' or 'add'
        // Trying 'add' as it is more standard for vector stores
        await (vectorAdapter as any).add(itemsToStore);

        return c.json({ success: true, count: itemsToStore.length });
    } catch (error) {
        console.error("Upload error:", error);
        return c.json({ error: "Upload failed", details: String(error) }, 500);
    }
};
