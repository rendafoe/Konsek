# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Konsek is a running companion web app that gamifies fitness consistency via Strava integration. Users maintain a pixel-art digital companion (Esko) whose health depends on their real-world running habits. Features collectible items, medals (in-game currency), achievements, and a Nordic forest-themed UI.

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server (port 3001)

# Build & Production
npm run build            # Build for production (Next.js)
npm run start            # Run production build

# Type Checking
npm run check            # TypeScript type check

# Database
npm run db:push          # Apply Drizzle migrations to database
npm run db:seed-items    # Seed 55 items into database
npm run db:reset         # Clear user data (dev only)
```

## Architecture

**Next.js App Router Structure:**
- `app/` - Pages and API route handlers
  - `app/(dashboard)/` - Authenticated pages with Navigation layout (Home, Inventory, Achievements, Activities, Archive, Settings)
  - `app/landing/` - Public landing page (no auth required)
  - `app/api/` - REST API route handlers
- `components/` - React components (shadcn/ui in `components/ui/`)
- `hooks/` - React Query hooks for data fetching
- `lib/` - Server utilities (db, storage, auth, services, API helpers)
- `shared/` - Shared types, Drizzle schema, Zod validation schemas
- `public/` - Static assets (esko sprites, item images)

**Path Aliases:**
- `@/*` → project root (`./`)
- `@shared/*` → `./shared/*`

**Key Files:**
- `shared/schema.ts` - All database tables (Drizzle) and Zod validation schemas
- `lib/storage.ts` - Database abstraction layer (DatabaseStorage class)
- `lib/auth.ts` - NextAuth.js configuration (credentials dev auth + Google OAuth)
- `lib/api-auth.ts` - API route auth helper (`getAuthenticatedUser()`)
- `lib/services/` - Business logic (medalService, itemRewards, weatherService)
- `app/(dashboard)/page.tsx` - Main dashboard page
- `lib/queryClient.ts` - React Query config and `apiRequest()` helper

**Data Flow:**
1. Client hooks (e.g., `use-character.ts`, `use-inventory.ts`) use React Query
2. API calls go through `apiRequest()` which handles credentials and errors
3. Next.js API route handlers validate with Zod and call storage layer methods
4. Storage layer uses Drizzle ORM for type-safe PostgreSQL queries

**API Routes:**
- `/api/strava/*` - Strava OAuth connection and sync
- `/api/character` - Character CRUD
- `/api/inventory/*` - Inventory management and equipping
- `/api/activities` - Paginated activity history
- `/api/achievements` - Item collection status
- `/api/medals/*` - Medal balance, check-ins, history
- `/api/shop/purchase` - Medal shop purchases
- `/api/dev/[action]` - Dev-only endpoints (gated behind NODE_ENV)
- `/api/auth/*` - NextAuth.js handlers (auto-managed)

**Database Tables:** users, characters, strava_accounts, runs, items, inventory, run_items, user_unlocks, daily_check_ins, medal_transactions, sessions, accounts, verification_tokens

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Frontend:** React 18, TypeScript, TanStack React Query, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Next.js API Route Handlers, Drizzle ORM, PostgreSQL (Supabase)
- **Auth:** NextAuth.js (Auth.js v5) with Drizzle adapter — CredentialsProvider (dev), Google OAuth (prod)
- **Deployment:** Vercel
- **External APIs:** Strava OAuth, OpenWeatherMap

## Development Notes

- Local dev mode uses CredentialsProvider (auto-signs in as `dev-user-1`)
- All pages are client components (`"use client"`) since they use interactive hooks
- Character health states range 0-4 (dead to perfect health)
- Minimum 1km runs count for health updates
- Item rarities: common, uncommon, rare, epic, legendary, mythic
- UI uses Nordic forest theme with light/dark modes via CSS variables
- Press Start 2P font for pixel-art aesthetic, DM Sans for UI text
- Environment variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `OPENWEATHER_API_KEY`
