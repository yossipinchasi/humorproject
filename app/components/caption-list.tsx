import VoteButtons from "./vote-buttons";
import StyleChip from "./style-chip";
import type { Caption, Vote } from "@/lib/types";

type Props = {
    captions: Caption[];
    myVotes: Map<string, Vote>;
    loggedIn: boolean;
    // "original" uses a fixed order so the crowd's ranking doesn't sway a fresh vote.
    order?: "score" | "original";
};

export function sortCaptions(captions: Caption[]) {
    return [...captions].sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at));
}

export default function CaptionList({ captions, myVotes, loggedIn, order = "score" }: Props) {
    const ranked = order === "score";
    const sorted = ranked ? sortCaptions(captions) : [...captions].sort((a, b) => a.id.localeCompare(b.id));

    return (
        <ul className="divide-y divide-border">
            {sorted.map((caption, i) => (
                <li key={caption.id} className="flex items-start gap-3 py-3">
                    <VoteButtons
                        captionId={caption.id}
                        score={caption.score}
                        myVote={myVotes.get(caption.id) ?? 0}
                        loggedIn={loggedIn}
                    />
                    <div className="min-w-0 flex-1 pt-1.5">
                        <p className={`leading-snug ${ranked && i === 0 && caption.score > 0 ? "text-lg font-semibold" : "text-base"}`}>
                            {caption.content}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {ranked && i === 0 && caption.score > 0 && (
                                <span className="rounded-full bg-up/15 px-2 py-0.5 text-xs font-semibold text-up">👑 Top caption</span>
                            )}
                            <StyleChip style={caption.style} />
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
