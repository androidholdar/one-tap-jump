# replit.md

## Overview

This is a **2D "One Tap Jump" mobile browser game** built as a full-stack web application. The player taps to jump between moving platforms, trying to survive as long as possible. The game features a main menu, gameplay screen, and game over screen with leaderboard support. Scores are persisted to a PostgreSQL database and displayed in a global leaderboard. The app is designed as a mobile-first portrait-mode experience with placeholder ad slots (banner, interstitial, rewarded) following mobile ad policy patterns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side router) — single main route (`/`) renders the Game page
- **Styling**: Tailwind CSS with CSS variables for theming, using a sky-gradient color palette. Shadcn/ui (new-york style) provides the component library with extensive Radix UI primitives
- **Game Rendering**: HTML5 Canvas via `requestAnimationFrame` loop in `GameCanvas.tsx`. Game state is stored in React refs (not state) to avoid re-renders during the game loop
- **State Management**: React Query (`@tanstack/react-query`) for server state (leaderboard scores). Local component state for game screens (MENU → PLAYING → GAMEOVER)
- **Animations & Effects**: Framer Motion for UI transitions, `canvas-confetti` for high score celebrations, `use-sound` for audio effects
- **Mobile-First Design**: Portrait mode locked, safe-area padding, touch event handling, no horizontal scroll. Banner ad placeholders are placed at screen bottom with sufficient spacing from interactive elements
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Runtime**: Node.js with Express, served via `tsx` in development
- **API**: Simple REST API with two endpoints defined in `shared/routes.ts`:
  - `GET /api/scores` — returns top 10 scores ordered by score descending
  - `POST /api/scores` — creates a new score entry (validated with Zod via `drizzle-zod`)
- **Validation**: Zod schemas generated from Drizzle table definitions via `drizzle-zod`. Shared between client and server through the `shared/` directory
- **Development**: Vite dev server is mounted as Express middleware with HMR support
- **Production**: Client is built with Vite to `dist/public/`, server is bundled with esbuild to `dist/index.cjs`

### Database
- **Database**: PostgreSQL (required — `DATABASE_URL` environment variable must be set)
- **ORM**: Drizzle ORM with `node-postgres` driver
- **Schema**: Single `scores` table with columns: `id` (serial PK), `username` (text), `score` (integer), `created_at` (timestamp, default now)
- **Migrations**: Managed via `drizzle-kit push` (`npm run db:push`) — pushes schema directly to database
- **Storage Layer**: `DatabaseStorage` class in `server/storage.ts` implements the `IStorage` interface, providing `getTopScores()` and `createScore()` methods

### Shared Code
- The `shared/` directory contains code used by both client and server:
  - `schema.ts` — Drizzle table definitions and Zod schemas
  - `routes.ts` — API route definitions with paths, methods, input schemas, and response schemas

### Build System
- **Dev**: `npm run dev` runs the Express server with Vite middleware for HMR
- **Build**: `npm run build` runs a custom build script that builds the client with Vite and the server with esbuild
- **Type Check**: `npm run check` runs TypeScript compiler in noEmit mode
- **DB Push**: `npm run db:push` syncs the Drizzle schema to the database

## External Dependencies

### Database
- **PostgreSQL** — Required. Connection via `DATABASE_URL` environment variable. Used with `pg` (node-postgres) pool and Drizzle ORM

### Key NPM Packages
- **Drizzle ORM + drizzle-zod + drizzle-kit** — Database ORM, schema-to-Zod generation, and migration tooling
- **Express** — HTTP server framework
- **Vite + @vitejs/plugin-react** — Frontend build tool and dev server
- **Radix UI** — Accessible UI primitives (dialog, toast, select, tabs, etc.)
- **Shadcn/ui** — Pre-built component library on top of Radix UI and Tailwind
- **@tanstack/react-query** — Server state management and data fetching
- **Framer Motion** — Animation library for UI transitions
- **canvas-confetti** — Confetti particle effects
- **use-sound** — React hook for playing sound effects (loaded from external URLs)
- **Wouter** — Lightweight client-side routing
- **Zod** — Schema validation (shared between client and server)
- **connect-pg-simple** — PostgreSQL session store (available but not currently used for sessions)

### External Assets
- **Google Fonts** — Fredoka (display), Outfit (body), and others loaded via CDN
- **Sound Effects** — Loaded from `assets.mixkit.co` URLs at runtime

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal** — Shows runtime errors in development
- **@replit/vite-plugin-cartographer** — Dev tooling (dev only)
- **@replit/vite-plugin-dev-banner** — Development banner (dev only)