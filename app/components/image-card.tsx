import Image from "next/image";
import Link from "next/link";
import CaptionList from "./caption-list";
import { imageUrl } from "@/lib/images";
import type { ImageWithCaptions, Vote } from "@/lib/types";

type Props = {
    image: ImageWithCaptions;
    myVotes: Map<string, Vote>;
    loggedIn: boolean;
    // On the feed, show only the top captions to keep scrolling fast.
    maxCaptions?: number;
    priority?: boolean;
};

export default function ImageCard({ image, myVotes, loggedIn, maxCaptions, priority }: Props) {
    const captions = maxCaptions
        ? [...image.captions].sort((a, b) => b.score - a.score).slice(0, maxCaptions)
        : image.captions;
    const hidden = image.captions.length - captions.length;

    return (
        <article className="overflow-hidden rounded-2xl border border-border bg-card">
            <Link href={`/i/${image.id}`} className="relative block aspect-square bg-border">
                <Image
                    src={imageUrl(image.storage_path)}
                    alt={image.context ?? "User-uploaded photo"}
                    fill
                    sizes="(max-width: 672px) 100vw, 672px"
                    className="object-cover"
                    priority={priority}
                />
            </Link>
            <div className="px-4 pb-2 pt-3">
                <p className="text-sm text-muted">
                    {image.author_name ? `Posted by ${image.author_name}` : "Posted"} ·{" "}
                    <time dateTime={image.created_at}>{timeAgo(image.created_at)}</time>
                </p>
                {image.context && <p className="mt-1 text-sm italic text-muted">“{image.context}”</p>}
                <CaptionList captions={captions} myVotes={myVotes} loggedIn={loggedIn} />
                {hidden > 0 && (
                    <Link href={`/i/${image.id}`} className="mb-2 block text-sm text-accent hover:underline">
                        See {hidden} more caption{hidden === 1 ? "" : "s"}
                    </Link>
                )}
            </div>
        </article>
    );
}

export function timeAgo(iso: string) {
    const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const units: [number, string][] = [
        [60 * 60 * 24 * 7, "w"],
        [60 * 60 * 24, "d"],
        [60 * 60, "h"],
        [60, "m"],
    ];
    for (const [size, label] of units) {
        if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
    }
    return "just now";
}
