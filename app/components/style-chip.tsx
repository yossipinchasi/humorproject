import { styleInfo } from "@/lib/styles";

export default function StyleChip({ style }: { style: string | null }) {
    const info = styleInfo(style);
    if (!info) return null;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${info.className}`}>
            <span aria-hidden>{info.emoji}</span>
            {info.label}
        </span>
    );
}
