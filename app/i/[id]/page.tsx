import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { imageUrl } from "@/lib/images";
import { getMyVotes } from "@/lib/votes";
import { deletePost } from "@/app/actions";
import ImageCard from "@/app/components/image-card";
import ShareButton from "@/app/components/share-button";
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
    const title = best ? `“${best.content}”` : "CapCity";
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
            <ImageCard image={image} myVotes={myVotes} loggedIn={Boolean(userId)} priority />
            <div className="flex items-center gap-4">
                <ShareButton path={`/i/${image.id}`} text={best?.content ?? "Look at this on CapCity"} />
                {userId === image.user_id && (
                    <form action={deletePost.bind(null, image.id)}>
                        <button type="submit" className="text-sm text-red-600 hover:underline">Delete post</button>
                    </form>
                )}
            </div>
        </main>
    );
}
