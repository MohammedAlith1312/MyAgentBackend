import { PostgreSQLVectorAdapter } from "@voltagent/postgres";

const adapter = new PostgreSQLVectorAdapter({ connection: "dummy" });
console.log("Keys:", Object.keys(adapter));
console.log("Proto:", Object.getOwnPropertyNames(Object.getPrototypeOf(adapter)));
