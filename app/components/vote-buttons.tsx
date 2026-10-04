"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { vote } from "@/app/actions";
import type { Vote } from "@/lib/types";

type Props = {
    captionId: string;
    score: number;
    myVote: Vote;
    loggedIn: boolean;
};

export default function VoteButtons({ captionId, score, myVote, loggedIn }: Props) {
    const [error, setError] = useState<string | null>(null);
    const [, startTransition] = useTransition();
    const [state, setOptimistic] = useOptimistic(
        { vote: myVote, score },
        (current, next: Vote) => ({ vote: next, score: current.score - current.vote + next })
    );

    if (!loggedIn) {
        return (
            <div className="flex w-12 shrink-0 flex-col items-center text-muted">
                <Link href="/login" title="Log in to vote" className="px-2 hover:text-up" aria-label="Log in to upvote">▲</Link>
                <span className="text-sm font-semibold tabular-nums">{score}</span>
                <Link href="/login" title="Log in to vote" className="px-2 hover:text-down" aria-label="Log in to downvote">▼</Link>
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
        <div className="flex w-12 shrink-0 flex-col items-center">
            <button
                type="button"
                onClick={() => cast(1)}
                aria-label="Upvote"
                aria-pressed={state.vote === 1}
                className={`px-2 ${state.vote === 1 ? "text-up" : "text-muted hover:text-up"}`}
            >
                ▲
            </button>
            <span
                className={`text-sm font-semibold tabular-nums ${
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
                className={`px-2 ${state.vote === -1 ? "text-down" : "text-muted hover:text-down"}`}
            >
                ▼
            </button>
            {error && <span role="alert" className="mt-1 text-center text-xs text-red-600">{error}</span>}
        </div>
    );
}
