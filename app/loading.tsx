// Skeleton while a page's data loads, so navigation feels instant.
export default function Loading() {
    return (
        <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
            <div className="h-16 rounded-3xl bg-border/60" />
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="size-9 rounded-full bg-border" />
                    <div className="h-3 w-24 rounded bg-border" />
                </div>
                <div className="aspect-square bg-border/60" />
                <div className="space-y-3 p-4">
                    <div className="h-4 w-4/5 rounded bg-border" />
                    <div className="h-4 w-3/5 rounded bg-border" />
                    <div className="h-4 w-2/3 rounded bg-border" />
                </div>
            </div>
        </div>
    );
}
