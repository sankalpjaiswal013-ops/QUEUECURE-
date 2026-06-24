# QueueCure 🏥

A modern, real-time patient queue management system built for clinics. Designed to streamline reception workflows and provide an elegant, always-syncing waiting room display.

## Features
- **Receptionist Portal**: Quickly check-in patients, manage queue statuses, and monitor consultation metrics.
- **Queue Display**: A fullscreen, kiosk-ready dashboard for the waiting room showing the active "Now Serving" token and live estimated wait times.
- **Real-Time Sync**: Powered by Supabase Realtime (WebSockets) to ensure instant updates across all devices.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **UI Components**: shadcn/ui + Tailwind CSS
- **Database & Realtime**: Supabase
- **Styling**: Tailwind CSS
- **Notifications**: Sonner

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory with your Supabase credentials (see below).

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

## Deployment 🚀

This project is optimized for deployment on [Vercel](https://vercel.com).

### Required Environment Variables
When deploying to Vercel (or any other hosting platform), you **MUST** provide the following environment variables in your project settings:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (e.g., `https://[PROJECT_ID].supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Project anon/public API key

*Note: Do not include `/rest/v1/` at the end of the Supabase URL.*

### Vercel Deployment Steps
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Import the repository into your Vercel dashboard.
3. In the **Environment Variables** section of the deployment configuration, add the two keys listed above.
4. Click **Deploy**. Vercel will automatically detect the Next.js framework and build the project.
