# Running Companion (Konsek)

## Overview

A desktop-first web application that gamifies running consistency by integrating with fitness platforms like Strava. Users maintain a pixel-art companion whose health and survival directly depends on their real-world running habits. The app syncs running data from connected fitness providers (minimum 1km runs count) and uses it to keep digital companions alive, healthy, and customizable with collectible gear.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing with protected route patterns
- **State Management**: TanStack React Query for server state, with custom hooks for each domain (auth, character, inventory, runs, strava)
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom Nordic forest theme (light/dark modes with CSS variables)
- **Animations**: Framer Motion for transitions and character animations
- **Fonts**: Press Start 2P for pixel art aesthetic, DM Sans for UI text

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in shared routes file with Zod schemas for validation
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

### Data Models
- **Users**: Managed by Replit Auth (sessions and users tables are mandatory)
- **Characters**: Digital companions with health states (0-4), stats, and sprite types (bear, elk, hare, otter, spirit, troll)
- **Strava Accounts**: OAuth tokens and sync metadata for fitness data integration
- **Items & Inventory**: Collectible gear system with equip/unequip functionality
- **Runs**: Activity records synced from fitness providers

### Build System
- **Development**: tsx for TypeScript execution, Vite dev server with HMR
- **Production**: esbuild for server bundling, Vite for client bundling
- **Output**: Combined dist folder with server (index.cjs) and client (public/) assets

### Path Aliases
- `@/*` maps to `client/src/*`
- `@shared/*` maps to `shared/*`
- `@assets` maps to `attached_assets/`

## External Dependencies

### Database
- **PostgreSQL**: Primary database via DATABASE_URL environment variable
- **Drizzle Kit**: Schema migrations with `db:push` command

### Authentication
- **Replit Auth**: OpenID Connect provider (ISSUER_URL, REPL_ID)
- **Session Secret**: Required SESSION_SECRET environment variable

### Fitness Platform Integration
- **Strava OAuth**: STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET for activity sync
- Planned support: Garmin Connect, Coros, Apple Health

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `STRAVA_CLIENT_ID` - Strava OAuth client ID
- `STRAVA_CLIENT_SECRET` - Strava OAuth client secret
- `REPL_ID` - Replit environment identifier
- `ISSUER_URL` - OpenID Connect issuer (defaults to Replit)