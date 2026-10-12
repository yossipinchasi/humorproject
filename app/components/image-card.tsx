import Link from "next/link";
import CaptionList, { sortCaptions } from "./caption-list";
import PostPhoto from "./post-photo";
import type { ImageWithCaptions, Vote } from "@/lib/types";

type Props = {
    image: ImageWithCaptions;
    myVotes: Map<string, Vote>;
    loggedIn: boolean;
    // On the feed, show only the top captions to keep scrolling fast.
    maxCaptions?: number;
    preload?: boolean;
};

export default function ImageCard({ image, myVotes, loggedIn, maxCaptions, preload }: Props) {
    const captions = maxCaptions ? sortCaptions(image.captions).slice(0, maxCaptions) : image.captions;
    const hidden = image.captions.length - captions.length;
    const totalVotes = image.captions.reduce((sum, c) => sum + c.upvotes + c.downvotes, 0);

    return (
        <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <header className="flex items-center gap-3 px-4 py-3">
                <Avatar name={image.author_name} />
                <div className="min-w-0 flex-1 text-sm leading-tight">
                    <p className="font-semibold">{image.author_name ?? "Someone"}</p>
                    <p className="text-muted">
                        <time dateTime={image.created_at}>{timeAgo(image.created_at)}</time>
                        {totalVotes > 0 && ` · ${totalVotes} vote${totalVotes === 1 ? "" : "s"}`}
                    </p>
                </div>
            </header>
            <Link href={`/i/${image.id}`} aria-label="Open post">
                <PostPhoto image={image} preload={preload} />
            </Link>
            <div className="px-4 pb-2 pt-3">
                {image.context && (
                    <p className="mb-1 text-sm text-muted">
                        <span className="font-semibold text-foreground">Context:</span> {image.context}
                    </p>
                )}
                <CaptionList captions={captions} myVotes={myVotes} loggedIn={loggedIn} />
                {hidden > 0 && (
                    <Link
                        href={`/i/${image.id}`}
                        className="mb-2 flex items-center justify-center rounded-full border border-border py-2 text-sm font-semibold text-accent hover:bg-accent/5"
                    >
                        See all {image.captions.length} captions →
                    </Link>
                )}
            </div>
        </article>
    );
}

export function Avatar({ name, size = "size-9" }: { name: string | null; size?: string }) {
    return (
        <span
            aria-hidden
            className={`${size} grid shrink-0 place-items-center rounded-full bg-accent/15 font-bold text-accent`}
        >
            {(name?.[0] ?? "?").toUpperCase()}
        </span>
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
