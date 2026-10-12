import Image from "next/image";
import { imageUrl } from "@/lib/images";
import type { Image as ImageRow } from "@/lib/types";

// Shows the whole photo (screenshots and portrait shots used to get cropped),
// letterboxed over a blurred copy of itself so every card keeps the same shape.
export default function PostPhoto({ image, preload }: { image: ImageRow; preload?: boolean }) {
    const src = imageUrl(image.storage_path);
    return (
        <div className="relative aspect-square overflow-hidden bg-neutral-900">
            <Image src={src} alt="" aria-hidden fill sizes="96px" className="scale-110 object-cover opacity-60 blur-2xl" />
            <Image
                src={src}
                alt={image.context ?? "User-uploaded photo"}
                fill
                sizes="(max-width: 672px) 100vw, 672px"
                className="object-contain"
                preload={preload}
            />
        </div>
    );
}
