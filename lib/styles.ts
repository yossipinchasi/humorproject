// Display info for the five caption styles Gemini writes (see lib/gemini.ts).
type StyleInfo = { emoji: string; label: string; className: string };

const STYLES: Record<string, StyleInfo> = {
    "dorm life": { emoji: "🛏️", label: "Dorm life", className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200" },
    "nyc newcomer": { emoji: "🗽", label: "NYC newcomer", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
    "chronically online": { emoji: "📱", label: "Chronically online", className: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200" },
    deadpan: { emoji: "😐", label: "Deadpan", className: "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200" },
    wholesome: { emoji: "🥹", label: "Wholesome", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" },
};

export function styleInfo(style: string | null): StyleInfo | null {
    if (!style) return null;
    return STYLES[style] ?? { emoji: "✨", label: style, className: "bg-border text-muted" };
}
