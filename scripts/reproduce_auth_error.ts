
import "dotenv/config";
import { githubCheckAuthTool } from "../src/tools/githubTool";

async function run() {
    console.log("--- Testing githubCheckAuthTool ---");

    try {
        // Simulate a call with a user that definitely doesn't have a token
        const result = await githubCheckAuthTool.execute({
            owner: "nonexistent-user"
        }, {
            userId: "user-with-no-token",
            context: { userId: "user-with-no-token" }
        });

        console.log("Result:", result);
    } catch (error) {
        console.error("Caught Error:", error);
    }
}

run();
