export const getBaseUrl = () => {
    // 1. Explicitly set BASE_URL (Highest priority)
    if (process.env.BASE_URL) return process.env.BASE_URL;

    // 2. Render internal environment variable
    if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;

    // 3. Fallback to local development
    const port = process.env.PORT || 5000;
    return `http://localhost:${port}`;
};
