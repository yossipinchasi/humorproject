"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GoogleSignInButton() {
    const [error, setError] = useState<string | null>(null);

    async function signIn() {
        setError(null);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            // Exact callback path, no extra query parameters.
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) setError(error.message);
    }

    return (
        <div>
            <button
                onClick={signIn}
                className="rounded border px-4 py-2 hover:bg-gray-100"
            >
                Sign in with Google
            </button>
            {error && <p className="mt-2 text-red-600">{error}</p>}
        </div>
    );
}
