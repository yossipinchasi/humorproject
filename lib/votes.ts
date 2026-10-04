import type { SupabaseClient } from "@supabase/supabase-js";
import type { Vote } from "@/lib/types";

// RLS only returns the signed-in user's own votes, so this needs no user filter.
export async function getMyVotes(supabase: SupabaseClient, captionIds: string[]) {
    const votes = new Map<string, Vote>();
    if (captionIds.length === 0) return votes;

    const { data } = await supabase
        .from("caption_votes")
        .select("caption_id, vote")
        .in("caption_id", captionIds);

    for (const row of data ?? []) votes.set(row.caption_id, row.vote as Vote);
    return votes;
}
