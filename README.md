# CapCity

Upload a photo, have Gemini write five captions for it, and vote on the funniest one.
It's built for Sam: a Columbia junior who is chronically online, grew up in the Midwest, and is still figuring out New York.

## Setup

1. **Database.** In the Supabase dashboard, open **SQL Editor** and run
   [`supabase/migrations/20261004000000_captions_and_votes.sql`](supabase/migrations/20261004000000_captions_and_votes.sql).
   It creates the tables, the vote-count trigger, the RLS policies, and the public `images` storage bucket.
   It also turns on RLS for every other table in `public`.
2. **Environment variables.** Add these to `.env.local`, and in Vercel under **Settings → Environment Variables**:

   | Variable | Where to get it |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API (already set) |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys (already set) |
   | `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys → **Secret key** (`sb_secret_…`). Server only, never expose it. |
   | `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) (free tier) |
   | `GEMINI_MODEL` | Optional. Defaults to `gemini-flash-latest`; falls back to `gemini-flash-lite-latest` when busy. |

3. `npm run dev` and open http://localhost:3000.

## How it works

- **Generate.** On `/upload`, which requires login, the browser shrinks the photo to 1600px.
  A Server Action then checks the session, sends the photo and the prompt to Gemini, and gets five captions back as structured JSON, one per style.
  It stores the photo in Supabase Storage and saves an `images` row plus five `captions` rows.
  Each caption row keeps the **exact prompt** and **model** that produced it.
- **Rate.** The ▲/▼ buttons call the `vote` Server Action, which upserts a row into `caption_votes` using the user's own session.
  Clicking the same arrow again removes the vote.
  A trigger keeps `captions.upvotes`, `downvotes`, and `score` in sync, so the feed never has to count votes.
  Logged-out visitors can browse, but the arrows send them to the login page, and the action and RLS both reject their votes.

## Row level security

The goal is the strictest rules that still let the app work:

| Table | anon | authenticated | Server (secret key) |
| --- | --- | --- | --- |
| `images` | read | read | insert / delete |
| `captions` | read | read | insert |
| `caption_votes` | nothing | read / insert / update / delete **only rows where `user_id = auth.uid()`** | n/a |
| everything else in `public` (e.g. `week2_items`) | nothing | nothing | n/a |
| storage bucket `images` | public read by URL | public read by URL | upload / delete |

Clients have no write access to `images` or `captions`. Otherwise, anyone could call the Supabase API directly and post a fake "AI" caption or attach a caption to someone else's photo.
Who voted for what stays private, and public totals come from the trigger.

## Product decisions (for Sam)

- **What brings people back every day:** a 🏆 **Caption of the day** (the top-voted caption from the last 24 hours) at the top of the feed, plus a **Top this week** leaderboard. Voting decides who wins, so every visit counts.
- **How the site becomes a source of content:** every post gets its own page (`/i/<id>`) with a **Share** button. It uses the native share sheet on phones and Open Graph tags, so a link pasted into a group chat unfurls with the photo and its best caption.
- **What I'd improve about Crackd.ai, and did here:**
  - The prompt is tuned to the audience. It asks for five distinct styles: dorm life, NYC newcomer, chronically online, deadpan, and wholesome. The results feel local rather than generic, and the style tags show which kind of humor wins.
  - An optional "What's going on here?" field gives the AI context it can't see, like "first time seeing a rat this big on the 1 train".
  - Guardrails: the prompt tells the model to punch up, never at people's appearance or identity. Uploaders can delete their posts. There's a 10-posts-per-day limit so one person can't use up the free AI quota.
  - The feed shows only the top 3 captions per photo, so the best jokes appear first and scrolling stays fast.
