"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { IMAGE_BUCKET } from "@/lib/images";
import { buildCaptionPrompt, generateCaptions, GEMINI_MODEL } from "@/lib/gemini";

export type UploadState = { error: string | null };

const MAX_BYTES = 5 * 1024 * 1024;
const DAILY_UPLOAD_LIMIT = 10;
const EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

export async function createPost(_prev: UploadState, formData: FormData): Promise<UploadState> {
    // Server Actions are reachable by direct POST, so always re-check the session.
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return { error: "You need to log in to post." };

    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) return { error: "Pick a photo first." };
    const ext = EXTENSIONS[file.type];
    if (!ext) return { error: "Photos must be JPG, PNG or WebP." };
    if (file.size > MAX_BYTES) return { error: "That photo is too big (5 MB max)." };

    const rawContext = formData.get("context");
    const context =
        typeof rawContext === "string" && rawContext.trim() ? rawContext.trim().slice(0, 200) : null;

    const admin = createAdminClient();

    // Keep the free Gemini quota from being drained by one person.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
        .from("images")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", since);
    if ((count ?? 0) >= DAILY_UPLOAD_LIMIT) {
        return { error: `You've hit today's limit of ${DAILY_UPLOAD_LIMIT} posts. Go vote on some captions instead!` };
    }

    const data = Buffer.from(await file.arrayBuffer());
    const prompt = buildCaptionPrompt(context);

    // Generate first so a failed generation doesn't leave an orphaned upload.
    let captions;
    try {
        captions = await generateCaptions({ data, mimeType: file.type }, prompt);
    } catch (e) {
        console.error("Caption generation failed:", e);
        return { error: "The AI couldn't caption that photo. Try a different one." };
    }
    if (captions.length === 0) {
        return { error: "The AI couldn't caption that photo. Try a different one." };
    }

    const imageId = randomUUID();
    const storagePath = `${user.id}/${imageId}.${ext}`;

    const { error: uploadError } = await admin.storage
        .from(IMAGE_BUCKET)
        .upload(storagePath, data, { contentType: file.type });
    if (uploadError) {
        console.error("Upload failed:", uploadError.message);
        return { error: "Upload failed. Please try again." };
    }

    const fullName: string | undefined = user.user_metadata?.full_name ?? user.user_metadata?.name;
    const { error: imageError } = await admin.from("images").insert({
        id: imageId,
        user_id: user.id,
        // First name only: posts are public.
        author_name: fullName?.split(" ")[0] ?? null,
        context,
        storage_path: storagePath,
    });

    const { error: captionError } = imageError
        ? { error: imageError }
        : await admin.from("captions").insert(
              captions.map((c) => ({
                  image_id: imageId,
                  content: c.content,
                  style: c.style,
                  prompt,
                  model: GEMINI_MODEL,
              }))
          );

    if (imageError || captionError) {
        console.error("Saving post failed:", (imageError ?? captionError)?.message);
        await admin.from("images").delete().eq("id", imageId);
        await admin.storage.from(IMAGE_BUCKET).remove([storagePath]);
        return { error: "Couldn't save your post. Please try again." };
    }

    redirect(`/i/${imageId}`);
}
