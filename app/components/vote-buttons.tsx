"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { vote } from "@/app/actions";
import type { Vote } from "@/lib/types";

type Props = {
    captionId: string;
    score: number;
    myVote: Vote;
    loggedIn: boolean;
};

const BUTTON = "grid size-9 place-items-center rounded-full transition active:scale-90";

export default function VoteButtons({ captionId, score, myVote, loggedIn }: Props) {
    const pathname = usePathname();
    const [error, setError] = useState<string | null>(null);
    const [, startTransition] = useTransition();
    const [state, setOptimistic] = useOptimistic(
        { vote: myVote, score },
        (current, next: Vote) => ({ vote: next, score: current.score - current.vote + next })
    );

    if (!loggedIn) {
        const login = `/login?next=${encodeURIComponent(pathname)}`;
        return (
            <div className="flex w-10 shrink-0 flex-col items-center text-muted">
                <Link href={login} title="Log in to vote" aria-label="Log in to upvote" className={`${BUTTON} hover:bg-up/10 hover:text-up`}>
                    <Arrow up />
                </Link>
                <span className="text-sm font-bold tabular-nums">{score}</span>
                <Link href={login} title="Log in to vote" aria-label="Log in to downvote" className={`${BUTTON} hover:bg-down/10 hover:text-down`}>
                    <Arrow />
                </Link>
            </div>
        );
    }

    function cast(clicked: 1 | -1) {
        // Clicking your current vote again clears it.
        const next: Vote = state.vote === clicked ? 0 : clicked;
        setError(null);
        startTransition(async () => {
            setOptimistic(next);
            const result = await vote(captionId, next);
            if (result.error) setError(result.error);
        });
    }

    return (
        <div className="flex w-10 shrink-0 flex-col items-center">
            <button
                type="button"
                onClick={() => cast(1)}
                aria-label="Upvote"
                aria-pressed={state.vote === 1}
                title="Funny"
                className={`${BUTTON} ${state.vote === 1 ? "bg-up text-white dark:text-black" : "text-muted hover:bg-up/10 hover:text-up"}`}
            >
                <Arrow up />
            </button>
            <span
                className={`text-sm font-bold tabular-nums ${
                    state.vote === 1 ? "text-up" : state.vote === -1 ? "text-down" : ""
                }`}
            >
                {state.score}
            </span>
            <button
                type="button"
                onClick={() => cast(-1)}
                aria-label="Downvote"
                aria-pressed={state.vote === -1}
                title="Not funny"
                className={`${BUTTON} ${state.vote === -1 ? "bg-down text-white dark:text-black" : "text-muted hover:bg-down/10 hover:text-down"}`}
            >
                <Arrow />
            </button>
            {error && <span role="alert" className="mt-1 text-center text-xs text-red-600">{error}</span>}
        </div>
    );
}

function Arrow({ up }: { up?: boolean }) {
    return (
        <svg viewBox="0 0 24 24" className={`size-5 ${up ? "" : "rotate-180"}`} fill="currentColor" aria-hidden>
            <path d="M12 4 3 15h6v5h6v-5h6z" />
        </svg>
    );
}
