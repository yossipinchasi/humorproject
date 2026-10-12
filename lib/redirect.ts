// Where to send someone after they log in. Shared by the login page, the
// sign-in button (which stores it in a cookie across the Google round trip)
// and the OAuth callback.
export const NEXT_COOKIE = "capcity_next";

// Only allow same-site paths, never "//evil.com" or "https://…".
export function safeNext(value: string | null | undefined): string {
    if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
    return value;
}
