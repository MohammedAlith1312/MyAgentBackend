import { Hono } from "hono";
import { storeToken } from "../db/tokens";

// Removed hardcoded USER_ID



export function authRoutes(defaultUserId?: string) {
    const app = new Hono();

    app.get("/github", (c) => {
        const clientId = process.env.GITHUB_CLIENT_ID;
        if (!clientId) return c.text("Missing GITHUB_CLIENT_ID", 500);

        const userId = c.req.query("userId");
        // Pass userId as 'state'. If missing, we rely on defaultUserId in the callback.
        const state = userId ? `&state=${encodeURIComponent(userId)}` : "";

        const redirectUri = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user:email${state}`;
        return c.redirect(redirectUri);
    });

    app.get("/github/callback", async (c) => {
        const code = c.req.query("code");
        const state = c.req.query("state"); // This is our specific userId if passed
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        if (!code || !clientId || !clientSecret) {
            return c.text("Missing code or credentials", 400);
        }

        try {
            // Exchange code for token
            const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                })
            });

            const data = await tokenRes.json();
            const accessToken = data.access_token;

            if (!accessToken) {
                return c.text(`Failed to get token: ${JSON.stringify(data)}`, 400);
            }

            // Fetch User Profile
            const userRes = await fetch("https://api.github.com/user", {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "VoltAgent-Backend"
                }
            });

            if (!userRes.ok) {
                return c.text("Failed to fetch GitHub user profile", 500);
            }

            const userData = await userRes.json();
            const username = userData.login; // e.g. "mohammed-alith" or "jdoe"

            // 1. Store under GitHub username (User requirement: "storage as github name")
            console.log(`🔐 [Auth Callback] Storing token for GitHub User: ${username}`);
            await storeToken(username, accessToken);

            // 2. Link to the requesting User ID so the active session can find it
            // This ensures http://localhost:5000/api/auth/github?userId=user works for the current session
            // We use 'state' (from URL) OR 'defaultUserId' (from app config)
            const targetUserId = state || defaultUserId;

            if (targetUserId && targetUserId !== username) {
                console.log(`🔗 [Auth Callback] Also linking UserID '${targetUserId}' to GitHub user '${username}'`);
                await storeToken(targetUserId, accessToken);
            }

            console.log(`✅ [Auth Callback] Authorization complete for user: ${username}`);

            return c.html(`
        <h1>✅ Login Successful</h1>
        <p>Connected GitHub account <strong>${username}</strong>.</p>
        ${targetUserId ? `<p>Linked to session user: <strong>${targetUserId}</strong></p>` : ''}
        <p>Token has been securely stored. You can close this window.</p>
        <script>setTimeout(() => window.close(), 3000)</script>
      `);

        } catch (e) {
            console.error(e);
            return c.text("Auth failed", 500);
        }
    });

    return app;
}
