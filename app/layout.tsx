import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
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
  title: "CapCity",
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
        <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
          <nav className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3">
            <Link href="/" className="text-lg font-bold">CapCity</Link>
            <span className="flex-1" />
            {loggedIn ? (
              <>
                <Link
                  href="/upload"
                  className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white dark:text-black"
                >
                  + Post
                </Link>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="text-sm text-muted hover:underline">Log out</button>
                </form>
              </>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-accent hover:underline">Log in</Link>
            )}
          </nav>
        </header>
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
