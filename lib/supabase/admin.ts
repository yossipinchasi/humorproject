import "server-only";
import { createClient } from "@supabase/supabase-js";

// Secret-key client that bypasses RLS. Only for server code that has already
// checked who the user is: images and captions have no client write policies.
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}
