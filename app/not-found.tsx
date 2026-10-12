import Link from "next/link";

export default function NotFound() {
    return (
        <main className="rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
            <p className="text-5xl" aria-hidden>🐀</p>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">This post took the wrong train</h1>
            <p className="mt-2 text-muted">It may have been deleted, or the link is broken.</p>
            <Link href="/" className="mt-6 inline-block rounded-full bg-accent px-5 py-2.5 font-semibold text-white hover:opacity-90 dark:text-black">
                Back to the feed
            </Link>
        </main>
    );
}
