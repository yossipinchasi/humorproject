import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
    const supabase = await createClient();

    // Server-side check (the proxy also redirects, but never rely on it alone).
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) redirect("/login");

    const { user } = data;
    const name = user.user_metadata?.full_name ?? user.user_metadata?.name;

    return (
        <main className="p-8">
            <h1 className="mb-4 text-2xl font-bold">Protected area</h1>
            <p className="mb-2">
                Welcome, <strong>{name ?? user.email}</strong>!
            </p>
            {name && <p className="mb-4 text-gray-600">{user.email}</p>}
            <p className="mb-6">You can only see this page because you are signed in with Google.</p>
            <form action="/auth/signout" method="post">
                <button type="submit" className="rounded border px-4 py-2 hover:bg-gray-100">
                    Log out
                </button>
            </form>
            <p className="mt-6">
                <Link href="/" className="underline">Back to home</Link>
            </p>
        </main>
    );
}
