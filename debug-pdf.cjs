
const pdf = require('pdf-parse');

async function test() {
    try {
        const buffer = Buffer.from("Hello world this is text content");
        console.log("Testing pdf-parse with text buffer...");
        const data = await pdf(buffer);
        console.log("Success:", data.text);
    } catch (e) {
        console.log("CAUGHT ERROR:");
        console.log(e);
        console.log("Message:", e.message);
    }
}

test();
