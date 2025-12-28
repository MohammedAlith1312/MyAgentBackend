import { getMostRecentToken, getToken } from "../db/tokens";



export async function getLatestGithubToken(userId?: string, targetUsername?: string): Promise<string> {

    // Strategy 1: strict Owner-Based Lookup (Priority)
    if (targetUsername) {
        console.log(`🔍 [getLatestGithubToken] specific Repo Owner requested: ${targetUsername}`);
        const ownerToken = await getToken(targetUsername); // Lookup by GitHub username directly

        if (ownerToken) {
            console.log(`✅ [getLatestGithubToken] Found token for Repo Owner: ${targetUsername}`);
            return ownerToken;
        }

        console.warn(`⚠️ [getLatestGithubToken] No token found for Repo Owner: ${targetUsername}`);
        throw new Error(`GitHub Token missing for user '${targetUsername}'. Please log in via /api/auth/github?userId=${targetUsername}`);
    }

    // Strategy 2: Fallback to Session User ID (Legacy/Generic)
    if (!userId) {
        throw new Error("User ID is required to retrieve GitHub token.");
    }

    console.log(`🔍 [getLatestGithubToken] Attempting to retrieve token for session user: ${userId}`);
    const userToken = await getToken(userId);

    if (userToken) {
        console.log(`✅ [getLatestGithubToken] Found token for session user: ${userId}`);
        return userToken;
    }

    console.warn(`⚠️ [getLatestGithubToken] No token found for session user: ${userId}.`);
    throw new Error("No GitHub Token found! Please log in via /api/auth/github.");
}
