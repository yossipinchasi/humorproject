"use client";

import { useState, useTransition } from "react";
import { deletePost } from "@/app/actions";

// Two-step delete so a stray tap can't wipe a post (and no blocking confirm() dialog).
export default function DeleteButton({ imageId }: { imageId: string }) {
    const [confirming, setConfirming] = useState(false);
    const [pending, startTransition] = useTransition();

    if (!confirming) {
        return (
            <button type="button" onClick={() => setConfirming(true)} className="text-sm text-muted hover:text-red-600">
                Delete post
            </button>
        );
    }

    return (
        <span className="flex items-center gap-2 text-sm">
            <span className="text-muted">Delete for good?</span>
            <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => deletePost(imageId))}
                className="rounded-full bg-red-600 px-3 py-1 font-semibold text-white disabled:opacity-60"
            >
                {pending ? "Deleting…" : "Delete"}
            </button>
            <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="text-muted hover:text-foreground">
                Cancel
            </button>
        </span>
    );
}
