
const fs = require('fs');
const pdf = require('pdf-parse');

async function test() {
    try {
        const buffer = Buffer.from("Hello world this is text content");
        console.log("Testing pdf-parse with text buffer...");
        const data = await pdf(buffer);
        console.log("Success:", data.text);
    } catch (e) {
        console.error("Error name:", e.name);
        console.error("Error message:", e.message);
        console.error("Error object:", JSON.stringify(e));
    }
}

test();
