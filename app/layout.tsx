import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import NavLink from "@/app/components/nav-link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "CapCity", template: "%s · CapCity" },
  description: "Upload a photo, get AI captions, and vote on the funniest ones.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <nav className="mx-auto flex max-w-2xl items-center gap-1 px-4 py-2.5">
            <Link href="/" className="mr-2 flex items-center gap-1.5 text-lg font-extrabold tracking-tight">
              <span aria-hidden>🏙️</span>
              <span>Cap<span className="text-accent">City</span></span>
            </Link>
            <span className="flex-1" />
            {loggedIn ? (
              <>
                <NavLink href="/rate">Rate</NavLink>
                <NavLink href="/me">Me</NavLink>
                <Link
                  href="/upload"
                  className="ml-1 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 dark:text-black"
                >
                  + Post
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 dark:text-black"
              >
                Log in
              </Link>
            )}
          </nav>
        </header>
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</div>
        <footer className="border-t border-border py-6 text-center text-xs text-muted">
          Captions are written by Google Gemini. Ratings come from people like you.
        </footer>
      </body>
    </html>
  );
}
