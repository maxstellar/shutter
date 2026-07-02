# Shutter

A daily photo journal for Hack Club intern cohorts (could potentially be repurposed for other cohorts). Each day has a prompt for at least one photo; members upload up to 5 photos per day and build streaks. Admins can set prompts and review submissions.

Built with SvelteKit, PostgreSQL (Drizzle ORM), and Hack Club OAuth.

## Demo Video


https://github.com/user-attachments/assets/a690efa7-af51-4e42-ba46-4244a5ebe2f5



## Features

**For members**

- Daily photo prompts, up to 5 uploads per day
- Streak tracking (3+ photos/day and the prompt met keeps your streak alive)
- Like other people's photos to promote the best ones to the top
- Streaks leaderboard
- Per-user notification preferences:
  - Daily reminder at a configurable hour
  - Web push notifications (when installed as a PWA)
  - Slack DM reminders
- Cohort gating: uploads + reminders are paused outside the configured `COHORT_START` / `COHORT_END` window

## Dev Setup

**1. Install dependencies**

```sh
npm install
```

**2. Configure environment variables**

Copy `.env.example` to `.env` and fill in the values:

| Variable                                                   | Description                                      |
| ---------------------------------------------------------- | ------------------------------------------------ |
| `DATABASE_URL`                                             | PostgreSQL connection string                     |
| `HACKCLUB_AUTH_CLIENT_ID`                                  | OAuth app client ID                              |
| `HACKCLUB_AUTH_CLIENT_SECRET`                              | OAuth app client secret                          |
| `HACKCLUB_AUTH_REDIRECT_URI`                               | OAuth redirect URI                               |
| `WHITELIST_IDS`                                            | Comma-separated Slack user IDs with access       |
| `ADMIN_IDS`                                                | Comma-separated Slack user IDs with admin access |
| `COHORT_START` / `COHORT_END`                              | Date range for the cohort (YYYY-MM-DD)           |
| `HACKCLUB_CDN_TOKEN`                                       | Token for Hack Club CDN image hosting            |
| `SLACK_BOT_TOKEN`                                          | For Slack notifications (optional)               |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | For web push notifications (optional)            |
| `CRON_SECRET`                                              | Secret for cron endpoints                        |

Generate VAPID keys with `npx web-push generate-vapid-keys`.

**3. Start the database**

```sh
npm run db:start   # starts a local Postgres container via Docker Compose
npm run db:migrate # applies migrations
```

**4. Run the dev server**

```sh
npm run dev
```

## Other scripts

```sh
npm run build       # production build
npm run preview     # preview production build
npm run check       # type checking
npm run db:studio   # Drizzle Studio (visual DB browser)
npm run db:generate # generate migrations from schema changes
```

## Self-hosting

Shutter is a regular SvelteKit app, so it runs on anything that can host one. You'll need:

- **Postgres**
- **A Hack Club Auth app**
- **Hack Club CDN app** — for image hosting (understand that this means your photos will be somewhat public?)
- **A way to run a cron job** — `hooks.server.ts` schedules an in-process hourly tick via [`croner`](https://github.com/Hexagon/croner), which hits `/api/cron/reminders`. If your host kills idle processes (most serverless platforms), point a real cron service (Vercel Cron, GitHub Actions on a schedule, etc.) at `/api/cron/reminders` with the `CRON_SECRET` bearer token instead.

Optionally:

- **Slack workspace + bot token** — only needed if you want DM reminders, the welcome DM on invite, or the admin "broadcast to non-push users" feature

To deploy: set the env vars from the table above, run `node migrate.js` once to apply migrations, then `node build/index.js` (or whatever your platform's start command is).

## Using Shutter for other cohorts

The "cohort" concept is generic - anyone with a defined start/end window can use this - think a Hack Club event, or a group trip, or even a class going through their school year together.

**Configuring your cohort**

- `COHORT_START` / `COHORT_END` controls when images can be submitted.
- The 3-photos-per-day streak threshold lives in `src/lib/server/streak.ts`.
- The 5-upload daily cap is in the upload route (`src/routes/(app)/upload/+server.ts`).

The app mentions "Hack Club" and "interns" by default - find instances and replace them as as needed.

**Slack bot**

The bot needs 5 scopes:

- **chat:write** - Send DM notifications and forward images to Slack if wanted
- **users:read** - Fetch user data for profile pictures and more
- **chat:write.public** - Forward images to public Slack channels the bot isn't in
- **channels:read** - Get channel info to confirm the bot can access it / post in it
- **groups:read** - Post in private channels the bot is invited to

Set up a Shutter bot (maybe themed around your specific cohort?) with these scopes, and you're golden!

## Contributing

PRs welcome!

## Disclosure of AI Use

This project used Claude Code for the implementation of various features, writing a good chunk of the code. Most technical workings were designed by me (including the login/auth system, the onboarding flow, integration with CDN and Slack, and more), but not manually implemented with hand-written code.

If you have any further questions about how to host your own instance of Shutter for a group or cohort, feel free to reach out to me on Slack @maxstellar or at my email!
