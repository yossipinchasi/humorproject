"use client";

import { useState } from "react";

export default function ShareButton({ path, text }: { path: string; text: string }) {
    const [copied, setCopied] = useState(false);

    async function share() {
        const url = `${window.location.origin}${path}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: "CapCity", text, url });
            } catch {
                // User closed the share sheet.
            }
            return;
        }
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <button type="button" onClick={share} className="text-sm text-accent hover:underline">
            {copied ? "Link copied!" : "Share"}
        </button>
    );
}
