import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/redirect";
import GoogleSignInButton from "./google-sign-in-button";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
    const { error, next: rawNext } = await searchParams;
    const next = safeNext(typeof rawNext === "string" ? rawNext : null);

    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) redirect(next);

    return (
        <main className="mx-auto max-w-md pt-6">
            <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
                <p className="text-5xl" aria-hidden>🏙️</p>
                <h1 className="mt-4 text-2xl font-bold tracking-tight">Log in to CapCity</h1>
                <p className="mt-2 text-muted">
                    Vote on the funniest AI captions, post your own photos, and see how your jokes rank.
                </p>

                {error && (
                    <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                        Sign-in didn&apos;t work. Please try again.
                    </p>
                )}

                <div className="mt-6">
                    <GoogleSignInButton next={next} />
                </div>

                <ul className="mt-8 space-y-2 text-left text-sm text-muted">
                    <li>▲ Upvote the captions that made you laugh</li>
                    <li>📸 Post a photo and get five AI captions in seconds</li>
                    <li>🏆 Climb the weekly leaderboard</li>
                </ul>
            </div>
            <p className="mt-6 text-center text-sm">
                <Link href="/" className="text-muted hover:text-foreground hover:underline">
                    ← Keep browsing without an account
                </Link>
            </p>
        </main>
    );
}
