import { vectorAdapter } from "./lib/retriever";

async function check() {
    console.log("Adapter initialized");
    console.log("Methods on prototype:");
    const proto = Object.getPrototypeOf(vectorAdapter);
    console.log(Object.getOwnPropertyNames(proto));

    console.log("Methods on object:");
    console.log(Object.keys(vectorAdapter));
}

check();
