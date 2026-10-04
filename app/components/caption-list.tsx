import VoteButtons from "./vote-buttons";
import type { Caption, Vote } from "@/lib/types";

type Props = {
    captions: Caption[];
    myVotes: Map<string, Vote>;
    loggedIn: boolean;
};

export default function CaptionList({ captions, myVotes, loggedIn }: Props) {
    const sorted = [...captions].sort(
        (a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at)
    );

    return (
        <ul className="divide-y divide-border">
            {sorted.map((caption) => (
                <li key={caption.id} className="flex items-start gap-2 py-3">
                    <VoteButtons
                        captionId={caption.id}
                        score={caption.score}
                        myVote={myVotes.get(caption.id) ?? 0}
                        loggedIn={loggedIn}
                    />
                    <div className="min-w-0 pt-1">
                        <p className="text-base leading-snug">{caption.content}</p>
                        {caption.style && (
                            <p className="mt-1 text-xs uppercase tracking-wide text-muted">{caption.style}</p>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}
