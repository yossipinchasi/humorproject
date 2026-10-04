"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { IMAGE_BUCKET } from "@/lib/images";
import type { Vote } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Upvote (1), downvote (-1) or clear (0) the current user's vote on a caption.
// Runs with the user's own session, so RLS guarantees they can only touch their own vote.
export async function vote(captionId: string, value: Vote): Promise<{ error: string | null }> {
    if (!UUID.test(captionId) || ![-1, 0, 1].includes(value)) {
        return { error: "Invalid vote." };
    }

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { error: "Log in to vote." };

    const { error } =
        value === 0
            ? await supabase
                  .from("caption_votes")
                  .delete()
                  .eq("caption_id", captionId)
                  .eq("user_id", auth.user.id)
            : await supabase
                  .from("caption_votes")
                  .upsert(
                      { caption_id: captionId, user_id: auth.user.id, vote: value },
                      { onConflict: "caption_id,user_id" }
                  );

    if (error) {
        console.error("Vote failed:", error.message);
        return { error: "Couldn't save your vote." };
    }

    refresh();
    return { error: null };
}

export async function deletePost(imageId: string) {
    if (!UUID.test(imageId)) return;

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/login");

    const admin = createAdminClient();
    const { data: image } = await admin
        .from("images")
        .select("storage_path, user_id")
        .eq("id", imageId)
        .single();

    // Only the uploader may delete their post.
    if (!image || image.user_id !== auth.user.id) return;

    await admin.from("images").delete().eq("id", imageId);
    await admin.storage.from(IMAGE_BUCKET).remove([image.storage_path]);
    redirect("/");
}
