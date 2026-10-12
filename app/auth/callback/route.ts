import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NEXT_COOKIE, safeNext } from "@/lib/redirect";

// OAuth redirect target: exchanges the authorization code (PKCE) for a session cookie.
export async function GET(request: NextRequest) {
    const { searchParams, origin } = request.nextUrl;
    const code = searchParams.get("code");

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // Send them back to the page they were on before logging in.
            const raw = request.cookies.get(NEXT_COOKIE)?.value;
            const next = safeNext(raw ? decodeURIComponent(raw) : null);
            const response = NextResponse.redirect(`${origin}${next}`);
            response.cookies.delete(NEXT_COOKIE);
            return response;
        }
        console.error("OAuth code exchange failed:", error.message);
    }

    return NextResponse.redirect(`${origin}/login?error=auth`);
}
