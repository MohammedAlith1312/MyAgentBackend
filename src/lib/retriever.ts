import { PostgreSQLVectorAdapter } from "@voltagent/postgres";

export const vectorAdapter = new PostgreSQLVectorAdapter({
    connection: process.env.DATABASE_URL!,
    tableName: "voltagent_vector_vectors",
} as any);

console.log("🔌 Vector Adapter initialized with table: voltagent_vector_vectors");

// Generate embeddings using OpenRouter API directly
export async function generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "openai/text-embedding-3-small",
            input: text,
        }),
    });

    if (!response.ok) {
        let errorText = await response.text();
        console.error(`❌ OpenRouter API Error (${response.status}):`, errorText);
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error?.message) errorText = errorJson.error.message;
        } catch { }
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}
