# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Konsek is a running companion web app that gamifies fitness consistency via Strava integration. Users maintain a pixel-art digital companion (Esko) whose health depends on their real-world running habits. Features collectible items, medals (in-game currency), achievements, and a Nordic forest-themed UI.

## Commands

```bash
# Development
npm run dev              # Start dev server (Express + Vite HMR on port 3001)

# Build & Production
npm run build            # Build for production (esbuild server + Vite client)
npm run start            # Run production build

# Type Checking
npm run check            # TypeScript type check

# Database
npm run db:push          # Apply Drizzle migrations to database
npm run db:seed-items    # Seed 55 items into database
npm run db:reset         # Clear user data (dev only)
```

## Architecture

**Monorepo Structure:**
- `client/` - React frontend (Vite, TanStack React Query, Tailwind, shadcn/ui)
- `server/` - Express backend (TypeScript, Drizzle ORM)
- `shared/` - Shared types, Drizzle schema, Zod validation schemas

**Path Aliases:**
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

**Key Files:**
- `shared/schema.ts` - All database tables (Drizzle) and Zod validation schemas
- `server/routes.ts` - All REST API endpoints (~900 lines)
- `server/storage.ts` - Database abstraction layer (IStorage interface)
- `client/src/pages/Dashboard.tsx` - Main UI page
- `client/src/lib/queryClient.ts` - React Query config and `apiRequest()` helper

**Data Flow:**
1. Client hooks (e.g., `use-character.ts`, `use-inventory.ts`) use React Query
2. API calls go through `apiRequest()` which handles credentials and errors
3. Server routes validate with Zod and call storage layer methods
4. Storage layer uses Drizzle ORM for type-safe PostgreSQL queries

**Database Tables:** users, characters, strava_accounts, runs, items, inventory, run_items, user_unlocks, daily_check_ins, medal_transactions, sessions

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Wouter (routing), TanStack React Query, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Express.js 5, TypeScript, Drizzle ORM, PostgreSQL (Supabase)
- **Auth:** Replit Auth (OpenID Connect) in production, mock auth in local dev
- **External APIs:** Strava OAuth, OpenWeatherMap

## Development Notes

- Local dev mode uses mock authentication (`/api/login`, `/api/logout`)
- Character health states range 0-4 (dead to perfect health)
- Minimum 1km runs count for health updates
- Item rarities: common, uncommon, rare, epic, legendary, mythic
- UI uses Nordic forest theme with light/dark modes via CSS variables
- Press Start 2P font for pixel-art aesthetic, DM Sans for UI text
