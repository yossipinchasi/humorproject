"use client";

import { useActionState, useState } from "react";
import { createPost, type UploadState } from "./actions";

const MAX_DIMENSION = 1600;

// Shrink phone photos before upload: faster on dorm Wi-Fi, cheaper for the AI,
// and keeps the request under the Server Action body limit.
async function downscale(file: File): Promise<File> {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) throw new Error("Could not encode image");
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

export default function UploadForm() {
    const [state, formAction, pending] = useActionState<UploadState, FormData>(createPost, { error: null });
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);

    async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const picked = e.target.files?.[0];
        setFileError(null);
        setFile(null);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        if (!picked) return;

        try {
            const small = await downscale(picked);
            setFile(small);
            setPreview(URL.createObjectURL(small));
        } catch {
            setFileError("Couldn't read that photo. Try a JPG or PNG.");
        }
    }

    function submit(formData: FormData) {
        if (!file) return;
        formData.set("image", file);
        formAction(formData);
    }

    const error = fileError ?? state.error;

    return (
        <form action={submit} className="space-y-4">
            <label className="block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-border bg-card text-center hover:border-accent">
                {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                    <img src={preview} alt="Selected photo preview" className="max-h-[28rem] w-full object-contain" />
                ) : (
                    <span className="block p-12 text-muted">📸 Tap to choose a photo</span>
                )}
                <input type="file" accept="image/*" onChange={onFileChange} className="sr-only" disabled={pending} />
            </label>

            <div>
                <label htmlFor="context" className="mb-1 block text-sm font-semibold">
                    What&apos;s going on here? <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                    id="context"
                    name="context"
                    maxLength={200}
                    placeholder="e.g. first time seeing a rat this big on the 1 train"
                    disabled={pending}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2"
                />
            </div>

            {error && <p role="alert" className="text-red-600">{error}</p>}

            <button
                type="submit"
                disabled={!file || pending}
                className="w-full rounded-full bg-accent px-4 py-3 font-semibold text-white disabled:opacity-50 dark:text-black"
            >
                {pending ? "Writing captions…" : "Generate captions"}
            </button>
            <p className="text-xs text-muted">
                Posts are public. Don&apos;t upload photos of people who wouldn&apos;t want to be posted.
            </p>
        </form>
    );
}
