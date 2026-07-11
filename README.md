# Paila — Walk with confidence

Nepal's AI-powered travel discovery, booking, and safety platform.

## Features

- Smart Nepal destination discovery with 140+ destinations
- Hidden Gems engine for off-the-beaten-path exploration
- AI trip planner with budget, duration, and difficulty filters
- Safety system with SOS alerts and emergency contacts
- Community feed with trail updates, tips, and stories
- Journey log with multi-photo upload and mood tracking
- Vendor marketplace (guides, homestays, transport)
- Interactive map with all destinations

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Demo Accounts

- Traveler: `demo@paila.com` / `Demo@1234`
- Admin: `admin@paila.com` / `Admin@1234`

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (Auth, Database, Storage)
- Leaflet maps
