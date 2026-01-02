import { PostgreSQLVectorAdapter } from "@voltagent/postgres";

const adapter = new PostgreSQLVectorAdapter({ connection: "dummy" });
console.log("Methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(adapter)));
console.log("Keys:", Object.keys(adapter));
