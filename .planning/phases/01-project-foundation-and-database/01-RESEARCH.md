# Phase 1: Project Foundation and Database - Research

**Researched:** 2026-03-07
**Domain:** Monorepo setup, Docker/PostgreSQL, Prisma 7 ORM, Express 5 skeleton
**Confidence:** HIGH (all core technologies verified with official documentation)

## Summary

Phase 1 establishes the entire development environment: a monorepo with three application directories (client, api, admin), a Docker Compose stack running PostgreSQL 16 and the Express 5 API, the complete Prisma 7 database schema with all 15+ entities, and the Express 5 API skeleton with middleware. This phase has zero business logic -- it is pure infrastructure that every subsequent phase builds on.

The critical technical risk in this phase is **Prisma 7**, which has breaking architectural changes from Prisma 5/6. The old patterns found in most online tutorials will not work. Prisma 7 requires: (1) a `prisma.config.ts` file instead of env vars in schema.prisma, (2) the `@prisma/adapter-pg` driver adapter for all database connections, (3) an explicit `output` path in the generator block (no longer generates into node_modules), (4) ESM configuration (`"type": "module"` in package.json), and (5) explicit `dotenv` loading since env vars are no longer auto-loaded.

**Primary recommendation:** Set up the monorepo with simple npm workspaces (no Nx/Turborepo needed at this scale), Docker Compose for PostgreSQL with health checks, Prisma 7 with the complete schema including all indexes, and the Express 5 skeleton with helmet/cors/rate-limit middleware. Use `tsx --watch` for development hot-reload. Do NOT use `nodemon` -- tsx is lighter, faster, and purpose-built for TypeScript execution.

---

## Standard Stack

### Core (Phase 1 Specific)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Express | 5.2.x | API server framework | Stable since Oct 2024. Promise-based middleware (no asyncHandler needed), path security, Node 18+ required. Express 4 is maintenance-only. |
| Prisma | 7.2.x+ | Database ORM + migrations | Current major version. ESM-native, driver-adapter architecture, `prisma.config.ts`. Min Node 20.19, min TS 5.4. |
| @prisma/adapter-pg | latest | PostgreSQL driver adapter for Prisma 7 | Required by Prisma 7 -- no built-in database drivers anymore. Wraps the `pg` driver. |
| pg | 8.x | PostgreSQL driver (node-postgres) | The standard Node.js PostgreSQL driver. Used by @prisma/adapter-pg. |
| PostgreSQL | 16 | Database | Current stable. Mature, relational, supports JSON, full-text search. Well-supported by Prisma. |
| TypeScript | 5.7+ | Type safety across all packages | Meets Prisma 7 minimum (5.4) with headroom. Strict mode. |
| Node.js | 22.x LTS | Runtime | Maintenance LTS until April 2027. Meets Prisma 7 minimum (20.19). |
| Docker + Compose | latest | Development environment | Consistent PostgreSQL across all dev machines. Health checks ensure startup ordering. |

### Supporting (Phase 1 Middleware)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| helmet | 8.1.x | HTTP security headers | Every Express app. Sets CSP, HSTS, X-Frame-Options, etc. in one call. |
| cors | 2.8.x | CORS middleware | Required for cross-origin requests from Next.js client to API. Restrict to Lumio domains. |
| express-rate-limit | 8.3.x | Rate limiting | Protect against abuse. 100 req/min general, 5 req/min auth endpoints. In-memory store is fine for single server. |
| dotenv | 16.x | Environment variable loading | Required by Prisma 7 (no auto-loading). Must `import 'dotenv/config'` before Prisma client use. |
| zod | 4.3.x | Schema validation | Validate environment variables at startup. Fail fast on missing config. |
| tsx | latest | TypeScript execution + watch mode | Development server runner. `tsx --watch src/server.ts` for hot reload. Replaces ts-node + nodemon combo. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| npm workspaces | Nx / Turborepo | Overkill for 3 packages. Adds learning curve and config overhead. npm workspaces handle shared deps and scripts fine. Upgrade to Turborepo later if build times become an issue. |
| tsx --watch | nodemon + ts-node | nodemon requires extra config file, ts-node has ESM compatibility issues. tsx handles ESM natively and is faster. |
| Single Prisma schema file | Multi-file schema | Prisma supports multi-file schemas, but with ~15 models a single file is manageable and easier to scan. Split if it exceeds 300 lines. |
| Single Content table (STI) | Separate tables per content type | STI with a `type` enum discriminator is simpler for queries, search, and "More Like This." Series-specific data (seasons/episodes) uses separate related tables. Channel-specific data uses optional fields or a relation. |

**Installation (api package):**
```bash
# Core
npm install express@5 cors helmet express-rate-limit dotenv zod

# Database
npm install @prisma/client @prisma/adapter-pg pg

# Dev
npm install -D prisma @types/pg @types/express @types/cors typescript tsx @types/node
```

---

## Architecture Patterns

### Recommended Monorepo Structure

```
lumio/
+-- package.json                    # Root: npm workspaces definition
+-- tsconfig.base.json              # Shared TypeScript compiler options
+-- docker-compose.yml              # PostgreSQL 16 + API service
+-- .env                            # Root env vars (DATABASE_URL, ports)
+-- .env.example                    # Template for .env
+-- .gitignore
+--
+-- api/                            # Express 5 API server
|   +-- package.json                # "type": "module"
|   +-- tsconfig.json               # Extends ../tsconfig.base.json
|   +-- prisma/
|   |   +-- schema.prisma           # Database models
|   |   +-- migrations/             # Migration history
|   +-- prisma.config.ts            # Prisma 7 configuration
|   +-- src/
|   |   +-- server.ts               # HTTP server startup + graceful shutdown
|   |   +-- app.ts                  # Express app factory (middleware + routes)
|   |   +-- routes/
|   |   |   +-- index.ts            # Route aggregator
|   |   |   +-- health.routes.ts    # GET /health endpoint
|   |   +-- middleware/
|   |   |   +-- error.middleware.ts  # Global error handler (4-arg)
|   |   |   +-- notFound.middleware.ts  # 404 handler
|   |   +-- config/
|   |   |   +-- env.ts              # Zod-validated environment config
|   |   |   +-- database.ts         # Prisma client singleton
|   |   +-- generated/
|   |   |   +-- prisma/             # Prisma 7 generated client (gitignored)
|   |   +-- types/
|   |       +-- express.d.ts        # Express Request augmentation
|
+-- client/                         # Next.js 15 client (skeleton only in Phase 1)
|   +-- package.json
|   +-- tsconfig.json
|
+-- admin/                          # Next.js 15 admin (skeleton only in Phase 1)
    +-- package.json
    +-- tsconfig.json
```

### Pattern 1: Prisma 7 Configuration (CRITICAL - New Pattern)

**What:** Prisma 7 moved database configuration out of `schema.prisma` into a new `prisma.config.ts` file and requires driver adapters for all database connections.
**When to use:** Every Prisma 7 project. This is not optional.
**Source:** [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7), [Prisma Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)

```typescript
// api/prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

```prisma
// api/prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

// NOTE: No `url` here -- it lives in prisma.config.ts now
datasource db {
  provider = "postgresql"
}
```

```typescript
// api/src/config/database.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export { prisma };
```

**Key differences from Prisma 5/6 that WILL break if ignored:**
1. Generator `provider` is `"prisma-client"` (not `"prisma-client-js"`)
2. Generator `output` is REQUIRED -- client no longer generates into node_modules
3. Database URL moved from `schema.prisma` to `prisma.config.ts`
4. Must use driver adapter (`@prisma/adapter-pg`) -- no built-in drivers
5. Must explicitly `import "dotenv/config"` -- env vars NOT auto-loaded
6. Import from generated path (`../generated/prisma/client.js`), not `@prisma/client`
7. The `generated/` directory should be gitignored and regenerated on install

### Pattern 2: Express 5 App Factory

**What:** Separate the Express app configuration from the HTTP server. The app factory creates and configures the Express instance with all middleware. The server file starts the HTTP listener.
**When to use:** Always. Enables testing the app without starting a server.
**Source:** [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html), [Express 5 Production Setup](https://www.reactsquad.io/blog/how-to-set-up-express-5-in-2025)

```typescript
// api/src/app.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { healthRouter } from "./routes/health.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import { env } from "./config/env.js";

export function buildApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS - restrict to known origins
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false })); // Express 5: extended false by default

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Routes
  app.use("/health", healthRouter);
  // Future: app.use("/api/auth", authRouter);
  // Future: app.use("/api/content", contentRouter);

  // Error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
```

```typescript
// api/src/server.ts
import "dotenv/config";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";

const app = buildApp();
const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

### Pattern 3: Express 5 Error Handling (New Promise Support)

**What:** Express 5 automatically catches rejected promises from async route handlers and forwards them to error middleware. No `asyncHandler` wrapper needed.
**When to use:** All async route handlers. This is a major improvement over Express 4.
**Source:** [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html)

```typescript
// Express 5: Async errors are automatically caught
// No need for express-async-handler or try/catch wrappers
router.get("/health", async (req, res) => {
  const dbStatus = await prisma.$queryRaw`SELECT 1`;
  // If this throws, Express 5 automatically passes it to error middleware
  res.json({ status: "ok", database: "connected" });
});

// Error handling middleware (must have 4 parameters)
// api/src/middleware/error.middleware.ts
import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: {
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
}
```

### Pattern 4: Zod-Validated Environment Configuration

**What:** Validate all environment variables at startup using Zod. Fail immediately with clear error messages if config is missing.
**When to use:** Always. Catches misconfiguration before runtime.

```typescript
// api/src/config/env.ts
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z
    .string()
    .transform((s) => s.split(","))
    .default("http://localhost:3000,http://localhost:3001"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
```

### Pattern 5: Docker Compose with Health Checks

**What:** Docker Compose for development with PostgreSQL health checks ensuring the API only starts after the database is ready.
**When to use:** Always for development. Prevents "connection refused" errors during startup.
**Source:** [Prisma Docker Guide](https://www.prisma.io/docs/guides/docker)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    container_name: lumio-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: lumio
      POSTGRES_USER: lumio
      POSTGRES_PASSWORD: lumio_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lumio -d lumio"]
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build:
      context: ./api
      dockerfile: Dockerfile.dev
    container_name: lumio-api
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      PORT: 5000
      DATABASE_URL: postgresql://lumio:lumio_dev_password@postgres:5432/lumio?schema=public
      CORS_ORIGINS: http://localhost:3000,http://localhost:3001
    volumes:
      - ./api/src:/app/src
      - ./api/prisma:/app/prisma
      - ./api/prisma.config.ts:/app/prisma.config.ts
    depends_on:
      postgres:
        condition: service_healthy
    command: >
      sh -c "npx prisma generate &&
             npx prisma migrate deploy &&
             npx tsx --watch src/server.ts"

volumes:
  postgres_data:
```

```dockerfile
# api/Dockerfile.dev
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Default command (overridden by docker-compose)
CMD ["npx", "tsx", "--watch", "src/server.ts"]
```

### Pattern 6: Shared TypeScript Base Configuration

**What:** Root tsconfig.base.json with shared compiler options. Each package extends it.
**When to use:** Every TypeScript monorepo.

```jsonc
// tsconfig.base.json (root)
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "verbatimModuleSyntax": true
  }
}
```

```jsonc
// api/tsconfig.json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*", "prisma.config.ts"],
  "exclude": ["node_modules", "dist", "src/generated"]
}
```

**ESM requirement:** All packages must have `"type": "module"` in their package.json. All local imports must use `.js` extensions (e.g., `import { prisma } from "./config/database.js"`). This is required by Node.js ESM module resolution and Prisma 7.

### Anti-Patterns to Avoid

- **Using Prisma 5/6 patterns:** Do NOT put `url = env("DATABASE_URL")` in schema.prisma. Do NOT omit the `output` field in the generator. Do NOT instantiate PrismaClient without an adapter. All of these will fail silently or with confusing errors.
- **Importing from `@prisma/client`:** In Prisma 7, import from your generated output path (`./generated/prisma/client.js`), not from `@prisma/client`. The latter will give you the wrong types or no types at all.
- **Skipping ESM configuration:** Prisma 7 ships as ESM. Missing `"type": "module"` in package.json will cause `ERR_REQUIRE_ESM` errors.
- **Skipping Docker health checks:** Without `service_healthy` condition on `depends_on`, the API container starts before PostgreSQL is ready, causing connection errors on first startup.
- **Using nodemon:** Adds unnecessary config file and has ESM compatibility issues. Use `tsx --watch` instead -- zero config, native ESM support.
- **Putting business logic in this phase:** Phase 1 is infrastructure only. No auth routes, no content CRUD, no payment logic. Just health check, middleware, and the database schema.

---

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Security headers | Custom header-setting middleware | `helmet` | 15+ security headers with proper defaults. One line. Battle-tested. |
| CORS handling | Manual `Access-Control-*` headers | `cors` package | Handles preflight OPTIONS, credentials, multiple origins. Edge cases are subtle. |
| Rate limiting | Custom counter middleware | `express-rate-limit` | Handles sliding windows, memory cleanup, header standards. Custom implementations leak memory. |
| Env validation | Manual `if (!process.env.X)` checks | `zod` schema validation | Type inference, coercion, default values, structured error messages. |
| TypeScript execution | Custom build step + node | `tsx` | Zero-config TypeScript runner with watch mode. No tsconfig for execution needed. |
| Database migrations | Raw SQL files | `prisma migrate` | Tracks migration history, generates SQL from schema diff, rollback support. |

**Key insight:** Phase 1 is all plumbing. Every component has a well-established library solution. The value is in correct configuration, not custom code.

---

## Common Pitfalls

### Pitfall 1: Prisma 7 Import Path Confusion

**What goes wrong:** Developer generates Prisma client but imports from `@prisma/client` (the old way). TypeScript may not error because `@prisma/client` still exports types, but the runtime PrismaClient constructor will fail or produce a client without the correct generated types for your schema.
**Why it happens:** Every Prisma tutorial before 2026 shows `import { PrismaClient } from '@prisma/client'`. This is wrong for Prisma 7 with custom output.
**How to avoid:** Always import from your generated output path: `import { PrismaClient } from "../generated/prisma/client.js"`. The `output` field in your generator block determines this path.
**Warning signs:** TypeScript shows generic types instead of your model names. Runtime errors about missing models.

### Pitfall 2: Missing ESM File Extensions

**What goes wrong:** Node.js ESM requires explicit file extensions in import statements. Developers write `import { foo } from "./bar"` which works in CommonJS but fails in ESM with `ERR_MODULE_NOT_FOUND`.
**Why it happens:** TypeScript historically allowed extensionless imports. With `"type": "module"` and Node.js ESM, you must use `.js` extensions (even for `.ts` files -- TypeScript resolves `.js` to `.ts` during compilation).
**How to avoid:** Set `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` in tsconfig.json. Use `.js` extensions in all import paths: `import { buildApp } from "./app.js"`.
**Warning signs:** `ERR_MODULE_NOT_FOUND` errors. Tests pass but runtime fails.

### Pitfall 3: Docker Compose DATABASE_URL Host Mismatch

**What goes wrong:** The `.env` file has `DATABASE_URL=postgresql://...@localhost:5432/...` for local development. But inside Docker, the API container cannot reach `localhost` -- it must use the Docker service name (e.g., `postgres`).
**Why it happens:** Docker containers have their own network namespace. `localhost` inside a container refers to the container itself, not the host machine.
**How to avoid:** Use separate env configs: `.env` for running outside Docker (`localhost`), and Docker Compose `environment:` block for inside Docker (uses service name `postgres`). The Docker Compose environment values override `.env`.
**Warning signs:** "Connection refused" errors only when running in Docker, not when running locally.

### Pitfall 4: Prisma Schema Design - Over-Normalizing Content Types

**What goes wrong:** Developer creates separate tables for Movie, Series, Documentary, and Channel with no shared base. This makes cross-content-type queries (search, "trending," home page rows) require UNION queries that Prisma doesn't support well.
**Why it happens:** OOP instinct to create a class hierarchy. But Prisma (and SQL in general) works better with single-table inheritance for this pattern.
**How to avoid:** Use a single `Content` table with a `ContentType` enum discriminator (`MOVIE`, `SERIES`, `DOCUMENTARY`, `CHANNEL`). Put shared fields (title, description, poster, year, rating, etc.) on the Content table. Series-specific data (seasons, episodes) uses separate related tables via foreign key. Channel-specific data (streamUrl, isLive) can use optional fields on Content or a separate ChannelMeta relation.
**Warning signs:** N+1 query patterns when building home page. Inability to sort/filter across content types without raw SQL.

### Pitfall 5: Forgetting Indexes on Foreign Keys and Query Fields

**What goes wrong:** Prisma creates foreign key constraints but does NOT automatically create indexes on foreign key columns. Queries filtering by userId, contentId, or status become slow as data grows.
**Why it happens:** Prisma's `@relation` creates the foreign key constraint at the database level but relies on you to add `@@index` for performance.
**How to avoid:** Add `@@index` directives on every foreign key column and any column frequently used in WHERE clauses (status, type, email, phone).
**Warning signs:** Slow queries on list endpoints. `EXPLAIN ANALYZE` showing sequential scans instead of index scans.

### Pitfall 6: Single-Point Prisma Client Without Disconnect Handling

**What goes wrong:** Prisma client is instantiated in a module but never properly disconnected on shutdown. In development with hot-reload, each restart creates a new connection pool, eventually exhausting PostgreSQL's connection limit (default: 100).
**Why it happens:** `tsx --watch` restarts the process on file changes. Each restart creates a new Prisma client with a new connection pool.
**How to avoid:** (1) Add graceful shutdown handlers that call `prisma.$disconnect()`. (2) In development, use a global singleton pattern that reuses the client across restarts. (3) Set PostgreSQL `max_connections` higher in development docker-compose or use a connection pool size limit in the adapter.
**Warning signs:** "Too many connections" errors after several hot-reloads. PostgreSQL logs showing connection count climbing.

---

## Code Examples

### Complete Prisma Schema for Lumio

This is the complete schema covering all entities specified in the success criteria. Verified against the project requirements and architecture research.

```prisma
// api/prisma/schema.prisma

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ============================================================
// ENUMS
// ============================================================

enum Role {
  USER
  ADMIN
}

enum ContentType {
  MOVIE
  SERIES
  DOCUMENTARY
  CHANNEL
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  EXPIRED
}

enum CouponType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_DAYS
}

// ============================================================
// USER & AUTH
// ============================================================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  phone         String    @unique
  passwordHash  String
  name          String
  role          Role      @default(USER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  sessions       Session[]
  payments       Payment[]
  subscriptions  Subscription[]
  watchProgress  WatchProgress[]
  watchlist      Watchlist[]
  favorites      Favorite[]
  referralsMade  Referral[]       @relation("ReferrerRelation")
  referredBy     Referral?        @relation("RefereeRelation")
  activityLogs   ActivityLog[]

  @@index([email])
  @@index([phone])
  @@index([role])
}

model Session {
  id          String   @id @default(uuid())
  userId      String
  deviceName  String
  deviceType  String
  ipAddress   String
  token       String   @unique
  expiresAt   DateTime
  lastActiveAt DateTime @default(now())
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@index([token])
}

// ============================================================
// CONTENT
// ============================================================

model Content {
  id              String      @id @default(uuid())
  type            ContentType
  title           String
  description     String?
  releaseYear     Int?
  duration        Int?        // minutes (null for series/channels)
  ageRating       String?     // e.g. "PG-13", "18+"
  quality         String?     // e.g. "HD", "4K"
  categories      String[]    // PostgreSQL array of genre/category strings
  posterPortrait  String?     // R2 URL for 600x900 portrait
  posterLandscape String?     // R2 URL for 1920x1080 landscape
  trailerUrl      String?     // YouTube or HLS URL
  videoUrl        String?     // HLS master playlist URL (for movies/docs)
  streamUrl       String?     // Live stream URL (for channels only)
  matchScore      Int?        // Static similarity score (0-100)
  isPublished     Boolean     @default(false)
  isFeatured      Boolean     @default(false)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  seasons        Season[]
  watchProgress  WatchProgress[]
  watchlist      Watchlist[]
  favorites      Favorite[]

  @@index([type])
  @@index([isPublished])
  @@index([isFeatured])
  @@index([title])
  @@index([type, isPublished])
}

model Season {
  id        String   @id @default(uuid())
  contentId String
  number    Int
  title     String?
  createdAt DateTime @default(now())

  content  Content   @relation(fields: [contentId], references: [id], onDelete: Cascade)
  episodes Episode[]

  @@unique([contentId, number])
  @@index([contentId])
}

model Episode {
  id          String   @id @default(uuid())
  seasonId    String
  number      Int
  title       String
  description String?
  duration    Int?     // minutes
  videoUrl    String?  // HLS master playlist URL
  thumbnail   String?  // R2 URL
  createdAt   DateTime @default(now())

  season Season @relation(fields: [seasonId], references: [id], onDelete: Cascade)

  @@unique([seasonId, number])
  @@index([seasonId])
}

// ============================================================
// BILLING & SUBSCRIPTIONS
// ============================================================

model Plan {
  id          String   @id @default(uuid())
  name        String   @unique  // "Weekly", "Monthly", "Quarterly"
  price       Int      // KES amount (integer, no decimals for M-Pesa)
  durationDays Int     // 7, 30, 90
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  payments      Payment[]
  subscriptions Subscription[]
}

model Payment {
  id                  String        @id @default(uuid())
  userId              String
  planId              String
  amount              Int           // KES paid (after discounts)
  discount            Int           @default(0)  // KES discount from referral/coupon
  status              PaymentStatus @default(PENDING)
  method              String        @default("MPESA")
  checkoutRequestId   String?       @unique  // Daraja CheckoutRequestID
  mpesaReceiptNumber  String?       // M-Pesa transaction receipt
  phoneNumber         String?       // M-Pesa phone used
  resultCode          Int?          // Daraja ResultCode
  resultDesc          String?       // Daraja ResultDesc
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan Plan @relation(fields: [planId], references: [id])

  @@index([userId])
  @@index([planId])
  @@index([status])
  @@index([checkoutRequestId])
  @@index([createdAt])
}

model Subscription {
  id          String             @id @default(uuid())
  userId      String
  planId      String
  status      SubscriptionStatus @default(ACTIVE)
  startsAt    DateTime
  expiresAt   DateTime
  autoRenew   Boolean            @default(false)
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan Plan @relation(fields: [planId], references: [id])

  @@index([userId])
  @@index([status])
  @@index([expiresAt])
  @@index([userId, status])
}

// ============================================================
// USER ENGAGEMENT
// ============================================================

model WatchProgress {
  id          String   @id @default(uuid())
  userId      String
  contentId   String
  episodeId   String?  // null for movies/docs, set for series episodes
  timestamp   Int      // seconds watched
  duration    Int      // total duration in seconds
  completed   Boolean  @default(false)
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  content Content @relation(fields: [contentId], references: [id], onDelete: Cascade)

  @@unique([userId, contentId, episodeId])
  @@index([userId])
  @@index([contentId])
  @@index([updatedAt])
}

model Watchlist {
  id        String   @id @default(uuid())
  userId    String
  contentId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  content Content @relation(fields: [contentId], references: [id], onDelete: Cascade)

  @@unique([userId, contentId])
  @@index([userId])
}

model Favorite {
  id        String   @id @default(uuid())
  userId    String
  contentId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  content Content @relation(fields: [contentId], references: [id], onDelete: Cascade)

  @@unique([userId, contentId])
  @@index([userId])
}

// ============================================================
// REFERRALS & COUPONS
// ============================================================

model Referral {
  id          String   @id @default(uuid())
  referrerId  String
  refereeId   String   @unique  // Each user can only be referred once
  creditAmount Int     @default(0)  // KES credit earned by referrer
  isRedeemed  Boolean  @default(false)  // True after referee's first payment
  createdAt   DateTime @default(now())

  referrer User @relation("ReferrerRelation", fields: [referrerId], references: [id], onDelete: Cascade)
  referee  User @relation("RefereeRelation", fields: [refereeId], references: [id], onDelete: Cascade)

  @@index([referrerId])
  @@index([refereeId])
}

model Coupon {
  id          String     @id @default(uuid())
  code        String     @unique
  type        CouponType
  value       Int        // Percentage (0-100) or KES amount or days
  maxUses     Int?       // null = unlimited
  currentUses Int        @default(0)
  expiresAt   DateTime?
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())

  @@index([code])
  @@index([isActive])
}

// ============================================================
// ADMIN & AUDIT
// ============================================================

model ActivityLog {
  id          String   @id @default(uuid())
  userId      String?  // null for system actions
  action      String   // e.g. "CREATE_CONTENT", "DELETE_USER", "UPDATE_PLAN"
  entityType  String   // e.g. "Content", "User", "Payment"
  entityId    String?
  details     Json?    // Flexible metadata about the action
  ipAddress   String?
  createdAt   DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([entityType])
  @@index([createdAt])
}
```

**Schema design decisions:**

1. **UUIDs for all primary keys:** Prevents enumeration attacks on content and user IDs. Required by the security spec.
2. **Single Content table with ContentType enum:** Enables cross-type queries for home page, search, trending. Series-specific data in Season/Episode tables. Channel streamUrl is an optional field on Content.
3. **PostgreSQL arrays for categories:** `String[]` maps to `text[]` in PostgreSQL. Simpler than a many-to-many junction table for this use case. Querying with `@> ARRAY['Action']` is fast with a GIN index (add later if needed).
4. **Integer amounts for M-Pesa:** M-Pesa uses integer KES amounts (no decimals). Storing as `Int` avoids floating-point precision issues.
5. **Composite unique constraints:** `@@unique([userId, contentId])` on Watchlist/Favorite prevents duplicates. `@@unique([seasonId, number])` ensures episode ordering.
6. **Indexes on all foreign keys and query columns:** Prisma does NOT auto-index foreign keys. Every `userId`, `contentId`, `status`, etc. has an explicit `@@index`.
7. **Cascade deletes:** Deleting a User cascades to their sessions, payments, watchlist, etc. Deleting Content cascades to watch progress. This is appropriate for this domain.
8. **ActivityLog.userId is optional:** System-generated events (cron jobs) have no user.

### Health Check Endpoint

```typescript
// api/src/routes/health.routes.ts
import { Router } from "express";
import { prisma } from "../config/database.js";

export const healthRouter = Router();

healthRouter.get("/", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});
```

### npm Workspaces Root package.json

```json
{
  "name": "lumio",
  "private": true,
  "workspaces": ["api", "client", "admin"],
  "scripts": {
    "dev:api": "npm run dev --workspace=api",
    "dev:client": "npm run dev --workspace=client",
    "dev:admin": "npm run dev --workspace=admin",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "db:migrate": "npm run db:migrate --workspace=api",
    "db:generate": "npm run db:generate --workspace=api",
    "db:studio": "npm run db:studio --workspace=api"
  }
}
```

### 404 Handler

```typescript
// api/src/middleware/notFound.middleware.ts
import type { Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prisma client in node_modules | Custom output path required | Prisma 7 (Jan 2026) | Must specify `output` in generator, import from generated path |
| `url = env("DATABASE_URL")` in schema.prisma | `prisma.config.ts` with `defineConfig` | Prisma 7 (Jan 2026) | Database URL no longer in schema file |
| Built-in database drivers | Driver adapters required | Prisma 7 (Jan 2026) | Must install and use `@prisma/adapter-pg` |
| `prisma-client-js` generator | `prisma-client` generator | Prisma 7 (Jan 2026) | Generator provider name changed |
| CommonJS module system | ESM required | Prisma 7 + Express 5 | `"type": "module"`, `.js` extensions in imports |
| Express 4 asyncHandler wrapper | Express 5 native promise support | Express 5 (Oct 2024) | No wrapper needed, async errors auto-caught |
| `app.get('/*', ...)` wildcard | `app.get('/*splat', ...)` named wildcard | Express 5 (Oct 2024) | Wildcards must be named |
| `res.send(body, status)` | `res.status(status).send(body)` | Express 5 (Oct 2024) | Status must be set before send |
| nodemon + ts-node | tsx --watch | 2024-2025 | Simpler, faster, native ESM support |
| `req.body` defaulting to `{}` | `req.body` defaults to `undefined` | Express 5 (Oct 2024) | Must check for undefined before accessing |

**Deprecated/outdated approaches to avoid:**
- `prisma-client-js` generator provider (use `prisma-client`)
- env() in schema.prisma datasource block (use prisma.config.ts)
- PrismaClient without adapter argument (must pass adapter)
- `import { PrismaClient } from '@prisma/client'` (import from generated path)
- Express 4 `express-async-handler` or `express-async-errors` (Express 5 handles this natively)
- `tailwind.config.js` (Tailwind v4 uses CSS-first `@theme` directive)

---

## Express 5 Specific Breaking Changes (Cheat Sheet)

These MUST be followed in all Express code in this project:

| Express 4 Pattern | Express 5 Replacement |
|--------------------|-----------------------|
| `app.get('/*', ...)` | `app.get('/{*splat}', ...)` |
| `res.send(body, 200)` | `res.status(200).send(body)` |
| `res.json(obj, 200)` | `res.status(200).json(obj)` |
| `res.redirect('back')` | `res.redirect(req.get('Referrer') \|\| '/')` |
| `req.param('name')` | `req.params.name`, `req.body.name`, or `req.query.name` |
| `app.del()` | `app.delete()` |
| asyncHandler wrapper | Not needed -- async errors auto-caught |
| `req.body` is `{}` when empty | `req.body` is `undefined` when no parser matches |
| `express.urlencoded({ extended: true })` | `express.urlencoded()` (extended false by default) |

---

## Open Questions

Things that couldn't be fully resolved during research:

1. **Prisma 7 connection pool size with PrismaPg adapter**
   - What we know: PrismaPg wraps the `pg` driver's Pool. Default pool size is likely 10 connections.
   - What's unclear: Whether `PrismaPg` accepts pool configuration options (e.g., `max`, `idleTimeoutMillis`) and the exact API for passing them.
   - Recommendation: Start with defaults. If connection exhaustion occurs during development hot-reload, pass `{ connectionString, max: 5 }` to PrismaPg (LOW confidence this is the exact API -- verify at implementation time).

2. **Prisma 7 generated directory and gitignore**
   - What we know: The generated client should be in `src/generated/prisma/` and should be gitignored since it's regenerated from the schema.
   - What's unclear: Whether `prisma generate` needs to run before TypeScript compilation in the Docker build pipeline, and the exact order of operations in the Dockerfile.
   - Recommendation: Run `npx prisma generate` as part of the Docker CMD before starting the server. Add `src/generated/` to `.gitignore`.

3. **npm workspaces with Docker**
   - What we know: Docker Compose mounts the api/ directory. The api package depends on workspace root for shared config.
   - What's unclear: Whether npm workspace hoisting causes issues when only the api/ directory is mounted into Docker.
   - Recommendation: Install dependencies inside the Docker container (copy package.json, run npm ci). Do NOT rely on host node_modules being mounted. The Dockerfile.dev should handle its own dependency installation.

---

## Sources

### Primary (HIGH confidence)
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7) -- Breaking changes, driver adapters, prisma.config.ts
- [Prisma Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference) -- defineConfig API, PrismaConfig type, env() helper
- [Prisma PostgreSQL Quickstart](https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/postgresql) -- Complete setup steps with driver adapter
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/docker) -- Docker Compose, health checks, migration commands
- [Prisma Table Inheritance](https://www.prisma.io/docs/orm/prisma-schema/data-model/table-inheritance) -- STI vs MTI patterns, TypeScript union types
- [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html) -- All breaking changes, removed methods, new features
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html) -- Promise rejection handling in Express 5

### Secondary (MEDIUM confidence)
- [Express 5 Production Setup](https://www.reactsquad.io/blog/how-to-set-up-express-5-in-2025) -- Project structure, app factory pattern, Zod validation
- [Production Middleware Guide 2026](https://virangaj.medium.com/comprehensive-guide-production-ready-middleware-in-node-js-typescript-2026-edition-f1c29184aacd) -- Helmet, CORS, rate limiting patterns
- [TypeScript Project References](https://oneuptime.com/blog/post/2026-01-24-typescript-project-references/view) -- Monorepo TypeScript configuration
- [TypeScript Monorepo Best Practices](https://blog.flycode.com/best-practices-for-typescript-monorepo) -- Shared config, workspace patterns
- [Docker Node.js Hot Reload](https://dev.to/dariansampare/setting-up-docker-typescript-node-hot-reloading-code-changes-in-a-running-container-2b2f) -- Volume mounts, watch mode in Docker

### Tertiary (LOW confidence)
- Prisma 7 configuration blog posts on Medium -- Practical gotchas (403 blocked, could not fully verify specifics)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All packages verified via official docs and npm registry
- Architecture (monorepo + Docker): HIGH -- Standard patterns, well-documented
- Architecture (Prisma 7 setup): HIGH -- Verified against official Prisma 7 docs
- Architecture (Express 5 patterns): HIGH -- Verified against official Express migration guide
- Schema design: MEDIUM-HIGH -- Based on architecture research + Prisma docs; exact field names may need adjustment during implementation based on Daraja API response fields
- Pitfalls: HIGH -- Prisma 7 gotchas verified with upgrade guide; Docker pitfalls are well-known

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable technologies, 30-day validity)
