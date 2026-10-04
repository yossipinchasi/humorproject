export const IMAGE_BUCKET = "images";

export function imageUrl(storagePath: string) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${storagePath}`;
}
