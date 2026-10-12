import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { imageUrl } from "@/lib/images";
import { getMyVotes } from "@/lib/votes";
import ImageCard from "@/app/components/image-card";
import StyleChip from "@/app/components/style-chip";
import VoteButtons from "@/app/components/vote-buttons";
import type { Caption, Image as ImageRow, ImageWithCaptions } from "@/lib/types";

type CaptionWithImage = Caption & { images: Pick<ImageRow, "id" | "storage_path" | "author_name"> };

const DAY_MS = 24 * 60 * 60 * 1000;

function isoAgo(ms: number) {
    return new Date(Date.now() - ms).toISOString();
}

export default async function Home({ searchParams }: PageProps<"/">) {
    const { tab } = await searchParams;
    const showTop = tab === "top";

    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    const loggedIn = Boolean(claims?.claims);

    const dayAgo = isoAgo(DAY_MS);
    const weekAgo = isoAgo(7 * DAY_MS);

    const [captionOfTheDay, feed] = await Promise.all([
        supabase
            .from("captions")
            .select("*, images(id, storage_path, author_name)")
            .gte("created_at", dayAgo)
            .gt("score", 0)
            .order("score", { ascending: false })
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle<CaptionWithImage>(),
        showTop
            ? supabase
                  .from("captions")
                  .select("*, images(id, storage_path, author_name)")
                  .gte("created_at", weekAgo)
                  .gt("score", 0)
                  .order("score", { ascending: false })
                  .limit(25)
                  .returns<CaptionWithImage[]>()
            : supabase
                  .from("images")
                  .select("*, captions(*)")
                  .order("created_at", { ascending: false })
                  .limit(20)
                  .returns<ImageWithCaptions[]>(),
    ]);

    if (feed.error) {
        return (
            <p role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                Couldn&apos;t load the feed. Refresh the page to try again.
            </p>
        );
    }

    const top = captionOfTheDay.data;
    const topCaptions = showTop ? (feed.data as CaptionWithImage[]) : [];
    const images = showTop ? [] : (feed.data as ImageWithCaptions[]);

    const captionIds = [
        ...(top ? [top.id] : []),
        ...topCaptions.map((c) => c.id),
        ...images.flatMap((i) => i.captions.map((c) => c.id)),
    ];
    const myVotes = loggedIn ? await getMyVotes(supabase, captionIds) : new Map();
    const unrated = images.filter((i) => i.captions.length > 0 && !i.captions.some((c) => myVotes.has(c.id))).length;

    return (
        <main className="space-y-6">
            {!loggedIn && <Welcome />}

            {loggedIn && unrated > 0 && (
                <Link
                    href="/rate"
                    className="flex items-center gap-4 rounded-3xl bg-accent p-4 text-white shadow-sm transition hover:opacity-95 dark:text-black"
                >
                    <span className="text-3xl" aria-hidden>⚡</span>
                    <span className="flex-1">
                        <span className="block font-bold">
                            {unrated} photo{unrated === 1 ? "" : "s"} waiting for your vote
                        </span>
                        <span className="block text-sm opacity-90">Rate mode shows them one at a time. Takes a minute.</span>
                    </span>
                    <span className="font-bold" aria-hidden>→</span>
                </Link>
            )}

            {top ? (
                <section className="overflow-hidden rounded-3xl border-2 border-up/50 bg-card shadow-sm">
                    <p className="bg-up/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-up">🏆 Caption of the day</p>
                    <div className="flex items-start gap-3 p-4">
                        <Link href={`/i/${top.images.id}`} className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-border">
                            <Image src={imageUrl(top.images.storage_path)} alt="" fill sizes="96px" className="object-cover" />
                        </Link>
                        <div className="min-w-0 flex-1">
                            <p className="text-lg font-semibold leading-snug">{top.content}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                                <StyleChip style={top.style} />
                                {top.images.author_name && <span>Photo by {top.images.author_name}</span>}
                            </div>
                        </div>
                        <VoteButtons
                            captionId={top.id}
                            score={top.score}
                            myVote={myVotes.get(top.id) ?? 0}
                            loggedIn={loggedIn}
                        />
                    </div>
                </section>
            ) : (
                <section className="flex items-center gap-3 rounded-3xl border border-dashed border-border p-4 text-sm text-muted">
                    <span className="text-2xl" aria-hidden>🏆</span>
                    <span>No caption of the day yet. Upvote the funniest caption you see and it could take the crown.</span>
                </section>
            )}

            <div role="tablist" aria-label="Feed" className="flex gap-1 rounded-full border border-border bg-card p-1 text-sm font-semibold">
                <TabLink href="/" active={!showTop}>✨ Fresh</TabLink>
                <TabLink href="/?tab=top" active={showTop}>🏆 Top this week</TabLink>
            </div>

            {showTop ? (
                topCaptions.length === 0 ? (
                    <EmptyState loggedIn={loggedIn} message="Nothing has been upvoted this week yet." />
                ) : (
                    <ol className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                        {topCaptions.map((caption, i) => (
                            <li key={caption.id} className="flex items-start gap-3 p-3">
                                <span className="w-7 pt-3 text-center text-lg font-extrabold tabular-nums text-muted">
                                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                                </span>
                                <Link href={`/i/${caption.images.id}`} className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-border">
                                    <Image src={imageUrl(caption.images.storage_path)} alt="" fill sizes="64px" className="object-cover" />
                                </Link>
                                <div className="min-w-0 flex-1 pt-1">
                                    <p className="leading-snug">{caption.content}</p>
                                    <div className="mt-1.5">
                                        <StyleChip style={caption.style} />
                                    </div>
                                </div>
                                <VoteButtons
                                    captionId={caption.id}
                                    score={caption.score}
                                    myVote={myVotes.get(caption.id) ?? 0}
                                    loggedIn={loggedIn}
                                />
                            </li>
                        ))}
                    </ol>
                )
            ) : images.length === 0 ? (
                <EmptyState loggedIn={loggedIn} message="No posts yet." />
            ) : (
                <div className="space-y-6">
                    {images.map((image, i) => (
                        <ImageCard
                            key={image.id}
                            image={image}
                            myVotes={myVotes}
                            loggedIn={loggedIn}
                            maxCaptions={3}
                            preload={i === 0}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}

// First-time visitors land here with no idea what the app is, so explain it.
function Welcome() {
    const steps = [
        { emoji: "📸", title: "Snap", text: "Post a photo of something only a Columbia kid in NYC would see." },
        { emoji: "🤖", title: "Caption", text: "Gemini writes five captions, each in a different style of humor." },
        { emoji: "▲", title: "Vote", text: "Everyone upvotes the funniest. The best one wins the day." },
    ];
    return (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                The AI writes the jokes. <span className="text-accent">You pick the winner.</span>
            </h1>
            <ol className="mt-5 grid gap-2 sm:grid-cols-3 sm:gap-3">
                {steps.map((s, i) => (
                    <li key={s.title} className="flex items-start gap-3 rounded-2xl bg-background p-3 sm:block sm:p-4">
                        <p className="w-7 text-center text-2xl sm:w-auto sm:text-left" aria-hidden>{s.emoji}</p>
                        <div>
                            <p className="font-bold sm:mt-2">{i + 1}. {s.title}</p>
                            <p className="mt-0.5 text-sm text-muted sm:mt-1">{s.text}</p>
                        </div>
                    </li>
                ))}
            </ol>
            <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                    href="/login"
                    className="rounded-full bg-accent px-5 py-2.5 font-semibold text-white shadow-sm transition hover:opacity-90 dark:text-black"
                >
                    Log in with Google to vote
                </Link>
                <span className="text-sm text-muted">or scroll down to browse</span>
            </div>
        </section>
    );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            role="tab"
            aria-selected={active}
            className={`flex-1 rounded-full px-4 py-2 text-center transition ${
                active ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
            }`}
        >
            {children}
        </Link>
    );
}

function EmptyState({ loggedIn, message }: { loggedIn: boolean; message: string }) {
    return (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted">
            <p className="text-4xl" aria-hidden>🌆</p>
            <p className="mt-2">{message}</p>
            <Link href={loggedIn ? "/upload" : "/login"} className="mt-3 inline-block font-semibold text-accent hover:underline">
                {loggedIn ? "Post the first photo →" : "Log in to post the first photo →"}
            </Link>
        </div>
    );
}
