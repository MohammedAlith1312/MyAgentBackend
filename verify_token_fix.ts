
import { getLatestGithubToken } from "./src/lib/githubToken";

async function test() {
    // Clear standard env var
    delete process.env.GITHUB_AUTH_TOKEN;

    // Set fallback env var
    process.env.GitHub_Aut_token = "test_token_fallback";

    try {
        const token = await getLatestGithubToken();
        if (token === "test_token_fallback") {
            console.log("SUCCESS: Fallback environment variable was read correctly.");
        } else {
            console.error(`FAILURE: Expected 'test_token_fallback', got '${token}'`);
        }
    } catch (e) {
        console.error("FAILURE: Threw error instead of reading token", e);
    }
}

test();
