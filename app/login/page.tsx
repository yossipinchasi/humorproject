import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoogleSignInButton from "./google-sign-in-button";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) redirect("/protected");

    const { error } = await searchParams;

    return (
        <main className="p-8">
            <h1 className="mb-4 text-2xl font-bold">Log in</h1>
            {error && (
                <p className="mb-4 text-red-600">Sign-in failed. Please try again.</p>
            )}
            <GoogleSignInButton />
            <p className="mt-6">
                <Link href="/" className="underline">Back to home</Link>
            </p>
        </main>
    );
}
