import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { imageUrl } from "@/lib/images";
import { Avatar, timeAgo } from "@/app/components/image-card";
import { sortCaptions } from "@/app/components/caption-list";
import StyleChip from "@/app/components/style-chip";
import { styleInfo } from "@/lib/styles";
import type { ImageWithCaptions } from "@/lib/types";

export const metadata: Metadata = { title: "Me" };

export default async function MePage() {
    const supabase = await createClient();
    // Server-side check (the proxy also redirects, but never rely on it alone).
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/login?next=/me");
    const user = auth.user;
    const name: string | null = user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;

    const [posts, votesCast] = await Promise.all([
        supabase
            .from("images")
            .select("*, captions(*)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .returns<ImageWithCaptions[]>(),
        // RLS only lets you count your own votes.
        supabase.from("caption_votes").select("caption_id", { count: "exact", head: true }),
    ]);

    const images = posts.data ?? [];
    const captions = images.flatMap((i) => i.captions);
    const upvotesEarned = captions.reduce((sum, c) => sum + c.upvotes, 0);

    // Which humor style wins most often on your photos.
    const wins = new Map<string, number>();
    for (const image of images) {
        const best = sortCaptions(image.captions)[0];
        if (best?.style && best.score > 0) wins.set(best.style, (wins.get(best.style) ?? 0) + 1);
    }
    const favoriteStyle = [...wins.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return (
        <main className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <Avatar name={name ?? user.email ?? null} size="size-14 text-xl" />
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-2xl font-extrabold tracking-tight">{name ?? "Your profile"}</h1>
                        <p className="truncate text-sm text-muted">{user.email}</p>
                    </div>
                    <form action="/auth/signout" method="post">
                        <button type="submit" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-foreground/5">
                            Log out
                        </button>
                    </form>
                </div>

                <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
                    <Stat label="Posts" value={images.length} />
                    <Stat label="Upvotes earned" value={upvotesEarned} />
                    <Stat label="Votes cast" value={votesCast.count ?? 0} />
                </dl>
                {favoriteStyle && (
                    <p className="mt-4 text-sm text-muted">
                        Your crowd loves{" "}
                        <span className="font-semibold text-foreground">
                            {styleInfo(favoriteStyle)?.emoji} {styleInfo(favoriteStyle)?.label.toLowerCase()}
                        </span>{" "}
                        captions on your photos.
                    </p>
                )}
            </section>

            <section>
                <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="text-lg font-bold">Your posts</h2>
                    <Link href="/upload" className="text-sm font-semibold text-accent hover:underline">+ New post</Link>
                </div>
                {images.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted">
                        <p className="text-4xl" aria-hidden>📸</p>
                        <p className="mt-2">You haven&apos;t posted yet. Your photos and how their captions rank will show up here.</p>
                        <Link href="/upload" className="mt-3 inline-block font-semibold text-accent hover:underline">
                            Post your first photo →
                        </Link>
                    </div>
                ) : (
                    <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                        {images.map((image) => {
                            const best = sortCaptions(image.captions)[0];
                            const votes = image.captions.reduce((s, c) => s + c.upvotes + c.downvotes, 0);
                            return (
                                <li key={image.id}>
                                    <Link href={`/i/${image.id}`} className="flex items-start gap-3 p-3 hover:bg-foreground/[0.03]">
                                        <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-border">
                                            <Image src={imageUrl(image.storage_path)} alt="" fill sizes="80px" className="object-cover" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="line-clamp-2 font-medium leading-snug">{best?.content ?? "No captions"}</span>
                                            <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                                                {best && best.score > 0 && <StyleChip style={best.style} />}
                                                <span>{votes} vote{votes === 1 ? "" : "s"} · {timeAgo(image.created_at)}</span>
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </main>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col-reverse rounded-2xl bg-background p-3">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-2xl font-extrabold tabular-nums">{value}</dd>
        </div>
    );
}
