"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const pathname = usePathname();
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
        <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                active ? "bg-foreground/10 text-foreground" : "text-muted hover:text-foreground"
            }`}
        >
            {children}
        </Link>
    );
}
