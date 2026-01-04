import { PostgreSQLVectorAdapter } from "@voltagent/postgres";

console.log("Starting check...");
try {
    const proto = PostgreSQLVectorAdapter.prototype;
    console.log("Prototype methods:", Object.getOwnPropertyNames(proto));
} catch (e) {
    console.error("Error:", e);
}
console.log("Check complete.");
