import { createBrowserClient } from "@supabase/ssr";

// Browser client (PKCE flow by default): stores the code verifier and session in cookies.
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
}
