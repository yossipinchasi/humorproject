export type Caption = {
    id: string;
    image_id: string;
    content: string;
    style: string | null;
    score: number;
    upvotes: number;
    downvotes: number;
    created_at: string;
};

export type Image = {
    id: string;
    user_id: string;
    author_name: string | null;
    context: string | null;
    storage_path: string;
    created_at: string;
};

export type ImageWithCaptions = Image & { captions: Caption[] };

export type Vote = -1 | 0 | 1;
