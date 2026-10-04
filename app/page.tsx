import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { imageUrl } from "@/lib/images";
import { getMyVotes } from "@/lib/votes";
import ImageCard from "@/app/components/image-card";
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
        return <p className="text-red-600">Couldn&apos;t load the feed: {feed.error.message}</p>;
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

    return (
        <main className="space-y-6">
            {top ? (
                <section className="rounded-2xl border border-up/40 bg-card p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-up">🏆 Caption of the day</p>
                    <div className="flex items-start gap-3">
                        <Link href={`/i/${top.images.id}`} className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-border">
                            <Image src={imageUrl(top.images.storage_path)} alt="" fill sizes="80px" className="object-cover" />
                        </Link>
                        <p className="flex-1 pt-1 text-lg font-semibold leading-snug">{top.content}</p>
                        <VoteButtons
                            captionId={top.id}
                            score={top.score}
                            myVote={myVotes.get(top.id) ?? 0}
                            loggedIn={loggedIn}
                        />
                    </div>
                </section>
            ) : (
                <section className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
                    🏆 No caption of the day yet. Upvote the funniest caption you see and it could be #1.
                </section>
            )}

            {!loggedIn && (
                <p className="rounded-2xl bg-card p-4 text-sm border border-border">
                    <Link href="/login" className="font-semibold text-accent hover:underline">Log in with Google</Link>{" "}
                    to vote on captions and post your own photos.
                </p>
            )}

            <div className="flex gap-2 text-sm font-semibold">
                <TabLink href="/" active={!showTop}>Fresh</TabLink>
                <TabLink href="/?tab=top" active={showTop}>Top this week</TabLink>
            </div>

            {showTop ? (
                topCaptions.length === 0 ? (
                    <EmptyState loggedIn={loggedIn} message="Nothing has been upvoted this week yet." />
                ) : (
                    <ol className="divide-y divide-border rounded-2xl border border-border bg-card">
                        {topCaptions.map((caption, i) => (
                            <li key={caption.id} className="flex items-start gap-3 p-3">
                                <span className="w-6 pt-2 text-right text-sm font-bold text-muted">{i + 1}</span>
                                <Link href={`/i/${caption.images.id}`} className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-border">
                                    <Image src={imageUrl(caption.images.storage_path)} alt="" fill sizes="64px" className="object-cover" />
                                </Link>
                                <p className="flex-1 pt-1 leading-snug">{caption.content}</p>
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
                            priority={i === 0}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 ${active ? "bg-foreground text-background" : "border border-border text-muted hover:text-foreground"}`}
        >
            {children}
        </Link>
    );
}

function EmptyState({ loggedIn, message }: { loggedIn: boolean; message: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
            <p>{message}</p>
            <Link href={loggedIn ? "/upload" : "/login"} className="mt-2 inline-block font-semibold text-accent hover:underline">
                {loggedIn ? "Post the first photo →" : "Log in to post the first photo →"}
            </Link>
        </div>
    );
}
