import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { imageUrl } from "@/lib/images";
import { getMyVotes } from "@/lib/votes";
import Link from "next/link";
import ImageCard from "@/app/components/image-card";
import ShareButton from "@/app/components/share-button";
import DeleteButton from "@/app/components/delete-button";
import type { ImageWithCaptions } from "@/lib/types";

async function getImage(id: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("images")
        .select("*, captions(*)")
        .eq("id", id)
        .maybeSingle<ImageWithCaptions>();
    return { supabase, image: data };
}

// Rich link previews, so a shared post looks good in a group chat.
export async function generateMetadata({ params }: PageProps<"/i/[id]">): Promise<Metadata> {
    const { id } = await params;
    const { image } = await getImage(id);
    if (!image) return {};

    const best = [...image.captions].sort((a, b) => b.score - a.score)[0];
    const title = best ? `“${best.content}”` : "Post";
    const description = "Vote on the funniest AI caption on CapCity.";
    const images = [imageUrl(image.storage_path)];
    return {
        title,
        description,
        openGraph: { title, description, images },
        twitter: { card: "summary_large_image", title, description, images },
    };
}

export default async function ImagePage({ params }: PageProps<"/i/[id]">) {
    const { id } = await params;
    const { supabase, image } = await getImage(id);
    if (!image) notFound();

    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims?.sub;
    const myVotes = userId ? await getMyVotes(supabase, image.captions.map((c) => c.id)) : new Map();

    const best = [...image.captions].sort((a, b) => b.score - a.score)[0];

    return (
        <main className="space-y-4">
            <Link href="/" className="inline-block text-sm font-semibold text-muted hover:text-foreground">
                ← Back to feed
            </Link>
            <ImageCard image={image} myVotes={myVotes} loggedIn={Boolean(userId)} preload />
            <div className="flex items-center gap-3">
                <ShareButton path={`/i/${image.id}`} text={best?.content ?? "Look at this on CapCity"} />
                {userId && (
                    <Link href="/rate" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-foreground/5">
                        Rate more photos →
                    </Link>
                )}
                <span className="flex-1" />
                {userId === image.user_id && <DeleteButton imageId={image.id} />}
            </div>
            {!userId && (
                <p className="rounded-2xl border border-border bg-card p-4 text-sm">
                    <Link href={`/login?next=/i/${image.id}`} className="font-semibold text-accent hover:underline">
                        Log in with Google
                    </Link>{" "}
                    to vote for your favorite caption.
                </p>
            )}
        </main>
    );
}
