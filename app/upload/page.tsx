import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UploadForm from "./upload-form";

export const metadata: Metadata = { title: "Post a photo" };

// Applies to the createPost Server Action too. Gemini can need a few attempts
// (3 models x 15s timeout in lib/gemini.ts), well past the platform's default limit.
export const maxDuration = 60;

export default async function UploadPage() {
    const supabase = await createClient();

    // Server-side check (the proxy also redirects, but never rely on it alone).
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) redirect("/login?next=/upload");

    return (
        <main>
            <h1 className="text-2xl font-extrabold tracking-tight">Post a photo</h1>
            <p className="mb-6 mt-1 text-muted">
                Subway chaos, dining hall mysteries, your roommate&apos;s questionable decor. Upload it and the AI
                writes five captions. Everyone votes on the best one.
            </p>
            <UploadForm />
        </main>
    );
}
