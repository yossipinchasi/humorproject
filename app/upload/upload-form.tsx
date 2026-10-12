"use client";

import { useActionState, useEffect, useState } from "react";
import { createPost, type UploadState } from "./actions";

const MAX_DIMENSION = 1600;

// Shown one after another while Gemini works (it usually takes 5–15 seconds).
const PROGRESS = [
    "Uploading your photo…",
    "Gemini is looking at it…",
    "Writing the dorm-life one…",
    "Writing the NYC-newcomer one…",
    "Making it chronically online…",
    "Adding the finishing touches…",
];

const IDEAS = [
    "first time seeing a rat this big on the 1 train",
    "the dining hall called this pasta",
    "my roommate's idea of decorating",
    "Butler at 3am during midterms",
];

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
    const [dragging, setDragging] = useState(false);
    const [step, setStep] = useState(0);
    const [context, setContext] = useState("");

    // Step through the progress messages while the post is being generated.
    useEffect(() => {
        if (!pending) return;
        const timer = setInterval(() => setStep((s) => Math.min(s + 1, PROGRESS.length - 1)), 2200);
        return () => clearInterval(timer);
    }, [pending]);

    async function pick(picked: File | undefined) {
        setFileError(null);
        if (!picked) return;
        if (!picked.type.startsWith("image/")) {
            setFileError("That's not a photo. Try a JPG or PNG.");
            return;
        }
        try {
            const small = await downscale(picked);
            if (preview) URL.revokeObjectURL(preview);
            setFile(small);
            setPreview(URL.createObjectURL(small));
        } catch {
            setFileError("Couldn't read that photo. Try a JPG or PNG.");
        }
    }

    function submit(formData: FormData) {
        if (!file) return;
        formData.set("image", file);
        setStep(0);
        formAction(formData);
    }

    const error = fileError ?? state.error;

    return (
        <form action={submit} className="space-y-5">
            <label
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    if (!pending) pick(e.dataTransfer.files?.[0]);
                }}
                className={`relative block cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed bg-card text-center transition ${
                    dragging ? "border-accent bg-accent/5" : "border-border hover:border-accent"
                }`}
            >
                {preview ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                        <img src={preview} alt="Selected photo preview" className="max-h-[28rem] w-full bg-neutral-900 object-contain" />
                        {!pending && (
                            <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                                Change photo
                            </span>
                        )}
                    </>
                ) : (
                    <span className="block px-6 py-14">
                        <span className="block text-5xl" aria-hidden>📸</span>
                        <span className="mt-3 block font-semibold">Tap to choose a photo</span>
                        <span className="mt-1 block text-sm text-muted">or drag one here</span>
                    </span>
                )}
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => pick(e.target.files?.[0])}
                    className="sr-only"
                    disabled={pending}
                />
            </label>

            <div>
                <label htmlFor="context" className="mb-1 block text-sm font-semibold">
                    What&apos;s going on here? <span className="font-normal text-muted">(optional, helps the AI get the joke)</span>
                </label>
                <input
                    id="context"
                    name="context"
                    maxLength={200}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g. first time seeing a rat this big on the 1 train"
                    disabled={pending}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                    {IDEAS.map((idea) => (
                        <button
                            key={idea}
                            type="button"
                            disabled={pending}
                            onClick={() => setContext(idea)}
                            className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-accent hover:text-foreground"
                        >
                            {idea}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={!file || pending}
                className="w-full rounded-full bg-accent px-4 py-3.5 font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:text-black"
            >
                {pending ? (
                    <span className="inline-flex items-center gap-2" aria-live="polite">
                        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                        {PROGRESS[step]}
                    </span>
                ) : file ? (
                    "✨ Generate 5 captions"
                ) : (
                    "Choose a photo first"
                )}
            </button>
            <p className="text-center text-xs text-muted">
                Posts are public. Don&apos;t upload photos of people who wouldn&apos;t want to be posted.
            </p>
        </form>
    );
}
