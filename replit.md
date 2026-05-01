# Replit.md

## Overview

This is a multilingual civic/NGO content management platform ("Civic Impact Studio") built as a full-stack TypeScript application. It allows administrators to manage projects and events with translations in English, Hindi, and Marathi (EN/HI/MR). The platform features a public-facing website showcasing featured projects and events, and an admin panel for content management including a rich text editor and image uploads.

The app follows a monorepo structure with three main directories: `client/` (React SPA), `server/` (Express API), and `shared/` (shared types, schemas, and route definitions).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
- **`client/`** — React single-page application (Vite bundler)
- **`server/`** — Express.js REST API server
- **`shared/`** — Shared TypeScript types, Drizzle schemas, Zod validations, and API route definitions used by both client and server

### Frontend (client/)
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for all server state
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives and Tailwind CSS
- **Rich Text Editor**: TipTap (with extensions for links, images, underline, text alignment, placeholders)
- **File Uploads**: Two-step presigned URL flow using Uppy — request URL from backend, then PUT file directly to cloud storage
- **Internationalization**: Custom `useI18n` hook with context provider supporting EN/HI/MR; language preference stored in localStorage
- **Route Transitions**: Full-page tricolour-themed loading animation on every route change (Indian flag inspired theme)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (server/)
- **Framework**: Express.js with TypeScript, run via `tsx` in development
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` is the single source of truth for all database tables
- **API Design**: REST endpoints defined in `shared/routes.ts` with Zod schemas for input validation and response typing
- **Authentication**: Replit OIDC (OpenID Connect) via Passport.js with session storage in PostgreSQL (`connect-pg-simple`)
- **Authorization**: Two-tier admin system — `super_admin` and `admin` roles stored in an `admins` table; admin check via `GET /api/admins/me`
- **Auto-promotion**: The email `admin@blackai.in` is automatically promoted to `super_admin` on first login
- **File Storage**: Replit Object Storage (Google Cloud Storage under the hood) with presigned URL upload flow
- **Build**: esbuild for server bundling, Vite for client bundling; output goes to `dist/`

### Database Schema (PostgreSQL + Drizzle)
Key tables defined in `shared/schema.ts`:
- **`sessions`** — Express session store (required for Replit Auth)
- **`users`** — User profiles from Replit OIDC
- **`admins`** — Admin role assignments (references users, has `role` enum: super_admin/admin)
- **`projects`** — Project records with `isFeatured` flag and `coverImagePath`
- **`project_translations`** — Per-language content (EN/HI/MR) with title, summary, contentHtml, status (draft/published)
- **`events`** — Event records with dates and `coverImagePath`
- **`event_translations`** — Per-language event content

Use `npm run db:push` (drizzle-kit push) to sync schema to database. Migrations output to `./migrations/`.

### API Structure
All API routes are under `/api/`. Key endpoint groups:
- `/api/auth/user` — Current user info
- `/api/login`, `/api/logout` — Auth flow
- `/api/admins/me` — Check admin status
- `/api/admins` — CRUD for admin management (super_admin only)
- `/api/projects` — CRUD for projects with translation sub-routes
- `/api/events` — CRUD for events with translation sub-routes
- `/api/home/featured` — Featured projects for homepage
- `/api/uploads/request-url` — Presigned URL for file uploads

### Key Design Decisions
1. **Shared route definitions**: `shared/routes.ts` defines API paths, methods, Zod input/output schemas in one place, used by both client hooks and server handlers. This ensures type safety across the stack.
2. **Translation model**: Content (projects/events) uses a separate translations table per entity rather than inline JSON, allowing independent publish status per language.
3. **Featured projects cap**: UI enforces a maximum of 4 featured projects with client-side warning/blocking.
4. **Presigned URL uploads**: Files never pass through the Express server; the client gets a signed URL and uploads directly to object storage, reducing server load.

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM** — Schema definition and query builder
- **drizzle-kit** — Schema push/migration tool

### Authentication
- **Replit OIDC** — OpenID Connect provider (issuer URL defaults to `https://replit.com/oidc`)
- **Passport.js** with `openid-client` strategy
- **connect-pg-simple** — PostgreSQL session store
- Required env vars: `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID`, `ISSUER_URL` (optional)

### File Storage
- **Replit Object Storage** — Uses `@google-cloud/storage` client configured to authenticate through Replit's sidecar service at `http://127.0.0.1:1106`
- **Uppy** (`@uppy/core`, `@uppy/react`, `@uppy/aws-s3`) — Client-side upload management

### Frontend Libraries
- **React 18** with **Vite** bundler
- **TanStack React Query** — Server state management
- **Wouter** — Client-side routing
- **shadcn/ui** + **Radix UI** — Component library
- **Tailwind CSS** — Styling
- **TipTap** — Rich text editor
- **Framer Motion** — Animations (route transition loader)
- **Lucide React** — Icon set
- **Zod** — Runtime validation (shared between client and server)

### Dev Tools
- **tsx** — TypeScript execution for development server
- **esbuild** — Server production bundling
- **@replit/vite-plugin-runtime-error-modal** — Dev error overlay