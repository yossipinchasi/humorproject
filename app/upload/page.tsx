import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UploadForm from "./upload-form";

export default async function UploadPage() {
    const supabase = await createClient();

    // Server-side check (the proxy also redirects, but never rely on it alone).
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) redirect("/login");

    return (
        <main>
            <h1 className="mb-1 text-2xl font-bold">Post a photo</h1>
            <p className="mb-6 text-muted">
                Subway chaos, dining hall mysteries, your roommate&apos;s questionable decor. Upload it and the AI
                writes five captions. Everyone votes on the best one.
            </p>
            <UploadForm />
        </main>
    );
}
