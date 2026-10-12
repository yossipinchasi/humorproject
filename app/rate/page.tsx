import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyVotes } from "@/lib/votes";
import CaptionList from "@/app/components/caption-list";
import PostPhoto from "@/app/components/post-photo";
import { Avatar, timeAgo } from "@/app/components/image-card";
import type { ImageWithCaptions } from "@/lib/types";

export const metadata: Metadata = { title: "Rate" };

// How far back Rate mode looks for photos you haven't voted on yet.
const POOL_SIZE = 60;

// Rate mode: one photo at a time, only ones you haven't voted on, so judging a
// batch takes a minute instead of scrolling past things you've already seen.
export default async function RatePage({ searchParams }: PageProps<"/rate">) {
    const { id, before } = await searchParams;

    const supabase = await createClient();
    // Server-side check (the proxy also redirects, but never rely on it alone).
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/login?next=/rate");

    const { data, error } = await supabase
        .from("images")
        .select("*, captions(*)")
        .order("created_at", { ascending: false })
        .limit(POOL_SIZE)
        .returns<ImageWithCaptions[]>();
    if (error) throw new Error(error.message);

    const pool = data.filter((i) => i.captions.length > 0);
    const myVotes = await getMyVotes(supabase, pool.flatMap((i) => i.captions.map((c) => c.id)));
    const isRated = (image: ImageWithCaptions) => image.captions.some((c) => myVotes.has(c.id));
    const unrated = pool.filter((i) => !isRated(i));

    // No photo picked yet: choose the next unrated one and pin it in the URL, so
    // voting (which refreshes the page) doesn't jump to a different photo.
    if (typeof id !== "string") {
        const cutoff = typeof before === "string" ? before : null;
        const next =
            (cutoff && unrated.find((i) => i.created_at < cutoff)) ||
            unrated.find((i) => i.created_at !== cutoff);
        if (next) redirect(`/rate?id=${next.id}`);
        return <AllCaughtUp total={pool.length} />;
    }

    const image = pool.find((i) => i.id === id);
    if (!image) redirect("/rate");

    const rated = isRated(image);
    const done = pool.length - unrated.length;
    const remaining = unrated.filter((i) => i.id !== image.id).length;
    const nextHref = `/rate?before=${encodeURIComponent(image.created_at)}`;

    return (
        <main className="space-y-4">
            <div>
                <div className="flex items-baseline justify-between gap-3">
                    <h1 className="text-2xl font-extrabold tracking-tight">Rate mode</h1>
                    <p className="text-sm text-muted tabular-nums">
                        {done} of {pool.length} rated
                    </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-border" aria-hidden>
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(done / pool.length) * 100}%` }} />
                </div>
            </div>

            <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <header className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={image.author_name} />
                    <p className="min-w-0 flex-1 text-sm leading-tight">
                        <span className="block font-semibold">{image.author_name ?? "Someone"}</span>
                        <span className="text-muted">{timeAgo(image.created_at)}</span>
                    </p>
                </header>
                <PostPhoto image={image} preload />
                <div className="px-4 pb-2 pt-3">
                    {image.context && (
                        <p className="mb-1 text-sm text-muted">
                            <span className="font-semibold text-foreground">Context:</span> {image.context}
                        </p>
                    )}
                    <p className="text-sm font-semibold">
                        {rated ? "Nice. Vote on as many as you like, then move on." : "Which captions are funny? ▲ yes, ▼ no."}
                    </p>
                    <CaptionList captions={image.captions} myVotes={myVotes} loggedIn order="original" />
                </div>
            </article>

            <div className="sticky bottom-4 z-10 flex gap-3">
                <Link
                    href={nextHref}
                    className={`flex-1 rounded-full px-5 py-3 text-center font-semibold shadow-lg transition ${
                        rated
                            ? "bg-accent text-white hover:opacity-90 dark:text-black"
                            : "border border-border bg-card text-foreground hover:bg-foreground/5"
                    }`}
                >
                    {remaining === 0 ? "Finish →" : rated ? "Next photo →" : "Skip →"}
                </Link>
            </div>
        </main>
    );
}

function AllCaughtUp({ total }: { total: number }) {
    return (
        <main className="rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
            <p className="text-5xl" aria-hidden>🎉</p>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">You&apos;re all caught up</h1>
            <p className="mt-2 text-muted">
                {total === 0
                    ? "There's nothing to rate yet. Be the first to post a photo."
                    : `You've voted on all ${total} recent photos. Post one of your own, or see what's winning.`}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/upload" className="rounded-full bg-accent px-5 py-2.5 font-semibold text-white hover:opacity-90 dark:text-black">
                    + Post a photo
                </Link>
                <Link href="/?tab=top" className="rounded-full border border-border px-5 py-2.5 font-semibold hover:bg-foreground/5">
                    🏆 Top this week
                </Link>
            </div>
        </main>
    );
}
