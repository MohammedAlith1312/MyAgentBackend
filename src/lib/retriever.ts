import { PostgreSQLVectorAdapter } from "@voltagent/postgres";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

export const vectorAdapter = new PostgreSQLVectorAdapter({
    connection: process.env.DATABASE_URL!,
    tableName: "voltagent_vector_vectors",
} as any);



// Actually, let's just export the adapter and a helper for embedding.
export async function generateEmbedding(text: string) {
    const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: text,
    });
    return embedding;
}
