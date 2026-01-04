import { Agent, createTool } from "@voltagent/core";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { liveEvalConfig } from "./scorers";
import { withToolTelemetry } from "../telemetry/withToolTelemetry";
import { z } from "zod";
import { vectorAdapter, generateEmbedding } from "../lib/retriever";

export function createRagSubAgent() {
    const model = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const searchTool = createTool({
        name: "search_knowledge_base",
        description: "Search for information in the knowledge base (documents, files). Use this to answer user questions about specific topics.",
        parameters: z.object({
            query: z.string().describe("The search query"),
        }),
        execute: async ({ query }) => {
            console.log(`🔍 [RAG] Searching for: "${query}"`);
            const embedding = await generateEmbedding(query);

            try {
                // 'search' is the confirmed method in PostgreSQLVectorAdapter
                const results = await (vectorAdapter as any).search(embedding, 3);
                console.log(`✅ [RAG] Found ${results.length} results`);
                results.forEach((r: any, i: number) => {
                    console.log(`   Result ${i + 1}: ${r.content?.substring(0, 100)}...`);
                });
                return JSON.stringify(results);
            } catch (e) {
                console.error(`⚠️ [RAG] Search failed, trying query(): ${e}`);
                try {
                    const results = await (vectorAdapter as any).query(embedding, 5);
                    console.log(`✅ [RAG] Found ${results.length} results (via query)`);
                    results.forEach((r: any, i: number) => {
                        console.log(`   Result ${i + 1}: ${r.content?.substring(0, 100)}...`);
                    });
                    return JSON.stringify(results);
                } catch (e2) {
                    console.error(`❌ [RAG] All search attempts failed: ${e2}`);
                    return `Error searching knowledge base: ${e}`;
                }
            }
        },
    });

    return new Agent({
        name: "rag-sub-agent",
        model: model.chat("google/gemini-2.0-flash-exp:free"),
        tools: [
            withToolTelemetry(searchTool)
        ],
        instructions: `
You are the RAG (Retrieval Augmented Generation) Subagent.
Your primary role is to retrieve information from the knowledge base to answer user questions.
- ALWAYS use the 'search_knowledge_base' tool when asked about facts, documents, or specific info.
- Summarize the search results to answer the user's question.
- If no results are found, state that clearly.
`,
        eval: liveEvalConfig,
    });
}
