# Phase 3: Content API and Admin Content Management - Research

**Researched:** 2026-03-07
**Domain:** Admin panel (React SPA), Express content CRUD API, image upload/processing
**Confidence:** HIGH

## Summary

This phase covers two major areas: (1) a backend content CRUD API with admin authentication, image upload, and content serving endpoints on the existing Express 5 API, and (2) a standalone React admin panel SPA in the `admin/` workspace for managing movies, series, documentaries, and TV channels.

The admin panel should be built with **React + Vite** (not Next.js) since it is an internal tool with no SEO needs and Vite provides faster dev experience for SPAs. **shadcn/ui** with Tailwind CSS is the recommended UI component library -- it provides copy-paste components built on Radix UI primitives with full control over styling, and has strong admin dashboard ecosystem support. For forms, **React Hook Form + Zod** (matching the API's existing Zod usage) provides type-safe validation. **TanStack Router** handles client-side routing with superior type safety, and **TanStack Table** powers the data table view with built-in sorting, filtering, and pagination support.

On the backend, **Multer 2.x** handles multipart file uploads on Express, and **Sharp 0.34.x** handles server-side image resizing and WebP conversion. The existing Prisma schema needs minor additions (cast, director fields on Content) and a new Category model to replace the plain `String[]` categories array so admins can manage categories as entities.

**Primary recommendation:** Use React + Vite + shadcn/ui + TanStack Router for the admin panel, Multer + Sharp on the API side, and offset-based pagination for the admin content lists (small dataset, simplicity wins over cursor-based).

## Standard Stack

### Core (Admin Panel)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI framework | Already in project ecosystem |
| Vite | 6.x | Build tool & dev server | Fastest DX for SPAs, 95% dev satisfaction, no SSR overhead needed |
| shadcn/ui | latest | UI component library | Copy-paste components on Radix UI, full customization, Tailwind native |
| Tailwind CSS | 4.x | Utility-first CSS | Pairs with shadcn/ui, rapid prototyping |
| TanStack Router | latest | Client-side routing | Type-safe routing, best SPA router in 2026 |
| TanStack Table | v8 | Data table with sorting/filtering | Headless, pairs with shadcn/ui, built-in sort/filter/pagination |
| React Hook Form | latest | Form state management | Minimal re-renders, Zod integration via @hookform/resolvers |
| @hookform/resolvers | latest | Zod-to-RHF bridge | Connects Zod schemas to React Hook Form |
| Zod | 3.25.x | Schema validation | Already used in API, shared validation schemas possible |
| react-dropzone | 15.x | Drag-and-drop file upload | Hook-based, HTML5-compliant, file type restriction |
| Axios or ky | latest | HTTP client | API calls from admin panel to Express backend |

### Core (API Backend additions)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| multer | 2.x | Multipart form-data parsing | Express official middleware, v2 fixes critical security CVEs |
| sharp | 0.34.x | Image resize/optimization | Fastest Node.js image processor, WebP/AVIF output, libvips-based |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | v5 | Server state management | Cache API responses, optimistic updates on content mutations |
| sonner | latest | Toast notifications | Feedback for CRUD operations (save, delete, publish) |
| lucide-react | latest | Icon library | Consistent icons, tree-shakeable, pairs with shadcn/ui |
| date-fns | latest | Date formatting | Display "added on" dates in content lists |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite | Next.js | Next.js adds SSR/SSG complexity unnecessary for an internal admin tool |
| TanStack Router | React Router v7 | React Router v7 type safety only works in framework mode, not SPA mode |
| shadcn/ui | MUI / Ant Design | MUI/Ant are heavier, less customizable, shadcn gives full code ownership |
| Multer | Busboy directly | Multer wraps Busboy with Express integration, simpler API |
| Offset pagination | Cursor pagination | Admin content lists are small (hundreds, not millions); offset is simpler and supports "jump to page" |

**Installation (Admin Panel):**
```bash
# Initialize Vite project in admin workspace
npm create vite@latest admin -- --template react-ts

# Init shadcn/ui
npx shadcn@latest init -t vite

# Core dependencies
npm install @tanstack/react-router @tanstack/react-query react-hook-form @hookform/resolvers zod react-dropzone axios lucide-react sonner date-fns

# TanStack Table
npm install @tanstack/react-table
```

**Installation (API additions):**
```bash
npm install multer sharp
npm install -D @types/multer
```

## Architecture Patterns

### Admin Panel Project Structure
```
admin/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui generated components
│   │   ├── layout/          # Sidebar, Header, PageContainer
│   │   ├── content/         # ContentCard, ContentGrid, ContentTable
│   │   ├── forms/           # MovieForm, SeriesForm, EpisodeForm, etc.
│   │   └── shared/          # FilterBar, StatusBadge, ImageUploader
│   ├── routes/              # TanStack Router route definitions
│   │   ├── __root.tsx        # Root layout with sidebar
│   │   ├── login.tsx         # Admin login page
│   │   ├── movies/
│   │   │   ├── index.tsx     # Movie list (grid/table toggle)
│   │   │   ├── new.tsx       # Create movie form
│   │   │   └── $movieId.tsx  # Edit movie form
│   │   ├── series/
│   │   │   ├── index.tsx     # Series list
│   │   │   ├── new.tsx       # Create series
│   │   │   ├── $seriesId.tsx # Edit series + manage seasons
│   │   │   └── $seriesId.seasons.$seasonId.tsx  # Season with episodes
│   │   ├── documentaries/
│   │   ├── channels/
│   │   └── settings/
│   │       └── categories.tsx # Category CRUD
│   ├── api/                 # API client functions
│   │   ├── client.ts         # Axios instance with auth interceptor
│   │   ├── content.ts        # Content CRUD API calls
│   │   ├── categories.ts     # Category API calls
│   │   └── auth.ts           # Admin login/logout
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts        # Auth state + token management
│   │   └── useContentFilters.ts
│   ├── lib/                 # Utilities
│   │   └── utils.ts          # cn() helper from shadcn
│   └── main.tsx
├── components.json          # shadcn/ui config
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

### API Backend Additions
```
api/src/
├── routes/
│   ├── admin.routes.ts       # Admin auth (login endpoint)
│   ├── content.routes.ts     # Content CRUD (admin-protected)
│   ├── category.routes.ts    # Category CRUD (admin-protected)
│   └── upload.routes.ts      # Image upload endpoint
├── services/
│   ├── content.service.ts    # Content business logic
│   ├── category.service.ts   # Category CRUD logic
│   └── upload.service.ts     # Image processing with Sharp
├── middleware/
│   ├── auth.middleware.ts     # Existing - add requireAdmin
│   └── upload.middleware.ts   # Multer configuration
├── validators/
│   ├── content.validators.ts  # Zod schemas for content
│   └── category.validators.ts
└── uploads/                  # Local file storage (dev only)
    ├── posters/
    │   ├── original/
    │   ├── large/             # 800px wide
    │   ├── medium/            # 400px wide
    │   └── thumbnail/         # 200px wide
    └── backdrops/
        ├── original/
        ├── large/             # 1920px wide
        └── medium/            # 960px wide
```

### Pattern 1: Admin Auth Guard (API)
**What:** Middleware that checks JWT for admin role before allowing access to admin routes
**When to use:** All content management and admin-only endpoints

```typescript
// api/src/middleware/auth.middleware.ts - add to existing file
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // requireAuth runs first (sets req.user)
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({
      error: { message: 'Admin access required', code: 'FORBIDDEN' },
    });
    return;
  }
  next();
}

// Usage in routes:
// router.post('/content', requireAuth, requireAdmin, createContent);
```

### Pattern 2: Dedicated Admin Login Endpoint
**What:** Separate login endpoint that only issues tokens for admin users
**When to use:** Admin panel authentication, separate from user auth flow

```typescript
// POST /api/admin/login
// Same credentials check as user login, but reject non-admin users
// Returns JWT with admin claim, separate session tracking
```

### Pattern 3: Image Upload with Sharp Processing Pipeline
**What:** Upload image, validate, resize to multiple sizes, store locally
**When to use:** Poster and backdrop image uploads

```typescript
// Upload flow:
// 1. Multer receives file (memory storage, 10MB limit)
// 2. Validate MIME type (image/jpeg, image/png, image/webp)
// 3. Sharp processes: original -> WebP at multiple sizes
// 4. Save to local filesystem with UUID filename
// 5. Return relative paths for all sizes

import sharp from 'sharp';

async function processImage(
  buffer: Buffer,
  type: 'poster' | 'backdrop'
): Promise<{ original: string; large: string; medium: string; thumbnail?: string }> {
  const id = crypto.randomUUID();
  const sizes = type === 'poster'
    ? { large: 800, medium: 400, thumbnail: 200 }
    : { large: 1920, medium: 960 };

  const results: Record<string, string> = {};

  for (const [sizeName, width] of Object.entries(sizes)) {
    const filename = `${id}-${sizeName}.webp`;
    const outputPath = `uploads/${type}s/${sizeName}/${filename}`;
    await sharp(buffer)
      .resize(width, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);
    results[sizeName] = `/${outputPath}`;
  }

  // Save original as WebP too
  const origFilename = `${id}-original.webp`;
  const origPath = `uploads/${type}s/original/${origFilename}`;
  await sharp(buffer).webp({ quality: 90 }).toFile(origPath);
  results.original = `/${origPath}`;

  return results as any;
}
```

### Pattern 4: Content List with Filters (API)
**What:** GET endpoint with query params for type, status, category, search, pagination
**When to use:** Content listing endpoints consumed by admin panel

```typescript
// GET /api/admin/content?type=MOVIE&status=published&category=action&search=matrix&page=1&limit=20
// Returns: { data: Content[], total: number, page: number, totalPages: number }

const querySchema = z.object({
  type: z.nativeEnum(ContentType),
  status: z.enum(['all', 'published', 'draft']).default('all'),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['title', 'releaseYear', 'quality', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

### Pattern 5: Admin Panel Auth Context
**What:** React context that manages admin JWT, auto-redirects to login
**When to use:** Wraps all authenticated admin routes

```typescript
// Axios interceptor adds Bearer token to all requests
// On 401 response, clear token and redirect to /login
// Store token in localStorage (admin panel is internal only)
```

### Pattern 6: Content Grid/Table Toggle
**What:** Two view modes sharing the same data source and filters
**When to use:** Content listing pages (movies, series, documentaries, channels)

```typescript
// Shared state: viewMode ('grid' | 'table'), filters, data from useQuery
// Grid: renders ContentCard components in CSS grid
// Table: renders TanStack Table with sortable columns
// FilterBar is shared above both views
```

### Anti-Patterns to Avoid
- **Shared auth between user and admin:** Admin login must be a separate endpoint. Never reuse user login flow for admin -- admin tokens should be distinguishable.
- **Storing images in the database:** Store file paths only. Images go to filesystem (dev) or R2 (production later).
- **Processing images synchronously in the request:** Use Sharp with `toFile()` not `toBuffer()` for large images to avoid memory pressure, but for admin uploads (one at a time), in-request processing is acceptable.
- **Fetching all content without pagination:** Always paginate, even if the dataset is small now. Build pagination into the API from day one.
- **Hardcoding image sizes:** Define size presets in a config object so they can be adjusted without code changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image resizing/format conversion | Custom Canvas/ImageMagick wrapper | Sharp | Handles edge cases (EXIF rotation, color profiles, alpha channels), 10x faster than alternatives |
| File upload parsing | Manual multipart parser | Multer 2.x | Stream handling, memory management, security (CVE patches in v2) |
| Data table with sort/filter/pagination | Custom table component | TanStack Table v8 | Column sorting, filtering, pagination all built-in with headless rendering |
| Drag-and-drop file upload UI | Custom drag event handlers | react-dropzone | Browser compatibility, file type validation, accessibility |
| Form state + validation | Custom useState forms | React Hook Form + Zod | Minimal re-renders, Zod schema reuse between frontend and API |
| UI components (dialogs, dropdowns, etc.) | Custom from scratch | shadcn/ui (Radix primitives) | Accessibility, keyboard navigation, focus management all handled |
| Toast notifications | Custom notification system | sonner | Stacking, auto-dismiss, promise toasts for async operations |

**Key insight:** An admin panel has dozens of UI patterns (forms, tables, dialogs, dropdowns, toasts). Building these from scratch would consume the entire phase budget. shadcn/ui + TanStack Table + React Hook Form provide 90% of what's needed out of the box.

## Common Pitfalls

### Pitfall 1: Schema Mismatch - Missing Fields
**What goes wrong:** The existing Prisma Content model lacks `cast` and `director` fields that requirements specify. Also, `categories` is `String[]` but the user wants admin-managed Category entities.
**Why it happens:** Schema was designed in Phase 1 before detailed form requirements were discussed.
**How to avoid:** Add a migration that: (1) adds `cast String[]` and `director String?` to Content, (2) creates a `Category` model with `id`, `name`, `slug`, `createdAt`, and (3) creates a `ContentCategory` join table or uses a relation. The simpler approach: keep `categories String[]` on Content but also have a `Category` model as the source of truth for valid category names. Admin creates categories in settings, content forms show dropdown populated from Category table, selected values stored as strings in `categories[]`.
**Warning signs:** Form fields that don't map to database columns.

### Pitfall 2: CORS Configuration for Admin Panel
**What goes wrong:** Admin panel at localhost:3001 cannot reach API at localhost:5000.
**How to avoid:** The existing `CORS_ORIGINS` env var already includes `http://localhost:3001`. Verify this is set and that the admin Vite dev server runs on port 3001. Configure Vite proxy as backup.

### Pitfall 3: Multer Memory Storage for Large Files
**What goes wrong:** Using `memoryStorage()` with large files causes memory spikes.
**Why it happens:** Multer loads entire file into Buffer.
**How to avoid:** For image uploads (max 10MB), memory storage is fine. Set explicit limits: `limits: { fileSize: 10 * 1024 * 1024 }`. For video uploads (Phase 6), switch to disk storage or streaming.
**Warning signs:** High memory usage under concurrent uploads.

### Pitfall 4: Sharp on Windows/WSL
**What goes wrong:** Sharp uses native binaries (libvips). Installation can fail on Windows or in WSL environments.
**Why it happens:** Platform-specific binary compilation.
**How to avoid:** Sharp 0.34.x includes prebuilt binaries for most platforms. If issues arise, run `npm rebuild sharp`. Ensure the API runs natively on Windows (not in WSL) or consistently in WSL.
**Warning signs:** `Module not found` errors after `npm install`.

### Pitfall 5: Admin Token vs User Token Confusion
**What goes wrong:** Admin uses user login endpoint, gets token without admin claim, can't access admin routes.
**Why it happens:** Reusing auth flow without role distinction.
**How to avoid:** Dedicated `/api/admin/login` endpoint. The existing JWT payload has `sub` and `sid` -- the `requireAdmin` middleware can look up `req.user.role` (already populated by `requireAuth` which loads user from session). No need for separate admin JWT claim -- the middleware chain handles it.

### Pitfall 6: Series Hierarchical CRUD Complexity
**What goes wrong:** Creating/editing series with seasons and episodes becomes a tangled mess of nested forms.
**Why it happens:** Trying to do everything in one form/page.
**How to avoid:** Follow the user's decision: separate pages. Create series first (basic info), then navigate to series detail to manage seasons (add/remove), then navigate to season detail to manage episodes. Each level is its own page with its own API calls. No nested form submissions.

### Pitfall 7: Image URL Handling Between Dev and Production
**What goes wrong:** Images stored as absolute local paths break when moving to R2.
**Why it happens:** Hardcoding `/uploads/posters/...` paths.
**How to avoid:** Store relative paths in the database (e.g., `posters/large/uuid.webp`). Serve via an API route (e.g., `GET /api/media/:path*`) that resolves to local file or later R2. This abstraction layer makes the migration to R2 seamless.

## Code Examples

### Multer Configuration for Image Upload
```typescript
// api/src/middleware/upload.middleware.ts
import multer from 'multer';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

// Usage: router.post('/upload/poster', imageUpload.single('image'), handlePosterUpload);
```

### Content CRUD Route Pattern
```typescript
// api/src/routes/content.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/auth.middleware.js';

export const contentRouter = Router();

// All routes require admin auth
contentRouter.use(requireAuth, requireAdmin);

// GET /api/admin/content?type=MOVIE&status=published&page=1
contentRouter.get('/', listContent);

// GET /api/admin/content/:id
contentRouter.get('/:id', getContent);

// POST /api/admin/content
contentRouter.post('/', createContent);

// PUT /api/admin/content/:id
contentRouter.put('/:id', updateContent);

// DELETE /api/admin/content/:id
contentRouter.delete('/:id', deleteContent);

// PATCH /api/admin/content/:id/publish
contentRouter.patch('/:id/publish', publishContent);

// PATCH /api/admin/content/:id/unpublish
contentRouter.patch('/:id/unpublish', unpublishContent);
```

### Zod Content Validation Schema
```typescript
// api/src/validators/content.validators.ts
import { z } from 'zod';

export const createMovieSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().optional(),
  releaseYear: z.coerce.number().int().min(1900).max(2100).optional(),
  duration: z.coerce.number().int().positive().optional(), // minutes
  ageRating: z.string().max(10).optional(), // PG, PG-13, R, etc.
  quality: z.enum(['SD', 'HD', 'FHD', '4K']).optional(),
  categories: z.array(z.string()).default([]),
  cast: z.array(z.string()).default([]),
  director: z.string().optional(),
  trailerUrl: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().optional(), // Reference only, not upload
  isPublished: z.boolean().default(false),
});

export const createSeriesSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().optional(),
  releaseYear: z.coerce.number().int().min(1900).max(2100).optional(),
  ageRating: z.string().max(10).optional(),
  quality: z.enum(['SD', 'HD', 'FHD', '4K']).optional(),
  categories: z.array(z.string()).default([]),
  cast: z.array(z.string()).default([]),
  director: z.string().optional(),
  trailerUrl: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
});

export const createEpisodeSchema = z.object({
  number: z.coerce.number().int().positive(),
  title: z.string().min(1).max(255).trim(),
  description: z.string().optional(),
  duration: z.coerce.number().int().positive().optional(),
  videoUrl: z.string().optional(),
});

export const createChannelSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().optional(),
  categories: z.array(z.string()).default([]),
  streamUrl: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
});
```

### shadcn/ui ContentCard Component Pattern
```typescript
// admin/src/components/content/ContentCard.tsx
// Uses shadcn Card, Badge, DropdownMenu
// Shows poster image, title, year, quality badge, status badge
// Hover reveals edit/delete actions via DropdownMenu
```

### TanStack Table Column Definition
```typescript
// admin/src/components/content/columns.tsx
import { ColumnDef } from '@tanstack/react-table';

export const movieColumns: ColumnDef<Movie>[] = [
  { accessorKey: 'title', header: 'Title', enableSorting: true },
  { accessorKey: 'releaseYear', header: 'Year', enableSorting: true },
  { accessorKey: 'quality', header: 'Quality', enableSorting: true },
  {
    accessorKey: 'isPublished',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isPublished ? 'default' : 'secondary'}>
        {row.original.isPublished ? 'Published' : 'Draft'}
      </Badge>
    ),
  },
  { accessorKey: 'createdAt', header: 'Added', enableSorting: true },
  // Actions column with edit/delete
];
```

### React Hook Form with Zod
```typescript
// admin/src/components/forms/MovieForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const movieFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  releaseYear: z.coerce.number().min(1900).max(2100).optional(),
  // ... matches API schema
});

type MovieFormValues = z.infer<typeof movieFormSchema>;

function MovieForm({ defaultValues, onSubmit }: MovieFormProps) {
  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* shadcn FormField components */}
      </form>
    </Form>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multer 1.x (security vulnerabilities) | Multer 2.x (CVE patches) | 2025-2026 | Must use 2.x for production |
| React Router for SPAs | TanStack Router | 2024-2025 | Better type safety in SPA mode |
| CSS-in-JS (styled-components) | Tailwind CSS + shadcn/ui | 2023-2024 | Better performance, copy-paste ownership |
| Custom form handling (useState) | React Hook Form + Zod | 2023+ | Minimal re-renders, shared validation schemas |
| JPEG/PNG only | WebP as default output | 2023+ | 25-35% smaller files, broad browser support |
| Cursor pagination everywhere | Offset for admin, cursor for public APIs | Always | Admin datasets are small, offset supports page jumping |

**Deprecated/outdated:**
- Multer 1.x: Critical security vulnerabilities (CVE-2026-2359, CVE-2026-3304, CVE-2026-3520), must use 2.x
- React Router v6 in SPA mode: v7 exists but type safety only works in framework mode
- JPEG thumbnails: WebP provides better compression at same quality

## Open Questions

1. **Category Model Design**
   - What we know: User wants admin-managed categories with a settings page. Current schema uses `String[]` on Content.
   - What's unclear: Whether to create a full Category model with join table, or keep `String[]` on Content and have Category model just as a source of valid names.
   - Recommendation: Create a `Category` model (`id`, `name`, `slug`, `createdAt`). Keep `categories String[]` on Content for simplicity (no join table needed). Admin creates/edits/deletes from Category table. Content forms populate dropdown from Category table. Content stores selected category names as strings. This avoids migration complexity and join table queries while giving admins category management.

2. **Admin Account Seeding**
   - What we know: Super-admin creates other admins. No self-registration.
   - What's unclear: How is the first admin created?
   - Recommendation: Provide a seed script (`prisma db seed` or a CLI command) that creates the initial admin account with a default password that must be changed on first login.

3. **Content Model Schema Changes**
   - What we know: Requirements mention `cast` and `director` fields not in current schema.
   - What's unclear: Whether to add these as schema migration in this phase or if they were intentionally omitted.
   - Recommendation: Add `cast String[]` and `director String?` to the Content model via Prisma migration at the start of this phase.

4. **Channel Model vs Content with type CHANNEL**
   - What we know: The schema has `ContentType.CHANNEL` in the enum AND a separate `Channel` model is absent -- channels use the Content model with `streamUrl` field.
   - What's unclear: The context mentions "TV channels" as separate sidebar items but they share the Content model.
   - Recommendation: Use Content model with `type: CHANNEL` and the existing `streamUrl` field. No separate model needed.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `api/prisma/schema.prisma`, `api/src/routes/`, `api/src/middleware/auth.middleware.ts` -- direct code review
- [Sharp official docs](https://sharp.pixelplumbing.com/api-resize/) -- resize API, output formats, quality options
- [shadcn/ui official installation guide](https://ui.shadcn.com/docs/installation/vite) -- Vite setup steps
- [Multer GitHub releases](https://github.com/expressjs/multer/releases) -- v2.1.1 latest, security fixes

### Secondary (MEDIUM confidence)
- [TanStack Table docs](https://tanstack.com/table/v8/docs/guide/sorting) -- sorting, filtering, pagination guides
- [React Hook Form + Zod integration](https://react-hook-form.com/docs/useform) -- zodResolver pattern
- [react-dropzone](https://react-dropzone.js.org/) -- hook-based file upload, v15
- Multiple web sources confirming Vite as preferred SPA build tool over Next.js for internal tools

### Tertiary (LOW confidence)
- Sharp 0.34.5 as latest version -- from web search, not verified on npm directly
- TanStack Router exact version -- need to verify during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified through official sources, established patterns
- Architecture: HIGH - Based on direct codebase analysis and established patterns for admin panels
- Pitfalls: HIGH - Schema gaps identified by comparing requirements to actual schema, platform issues well-documented
- Image processing: HIGH - Sharp API verified through official docs

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days -- stable ecosystem, no fast-moving dependencies)
