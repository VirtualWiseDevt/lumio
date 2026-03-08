# Phase 10: Admin Operations and Dashboard - Research

**Researched:** 2026-03-08
**Domain:** Admin dashboard UI (charts, data tables, stats, settings), admin API endpoints
**Confidence:** HIGH

## Summary

Phase 10 adds operational visibility to the existing admin panel: a dashboard with stat cards and charts, user management, billing management, settings configuration, and an activity log audit trail. The admin panel already has a mature foundation (React 19 + Vite 6 + Tailwind 4 + shadcn/ui dark theme) with established patterns for content list pages (FilterBar, Pagination, ContentTable with TanStack Table, TanStack Query for data fetching). This phase extends that foundation with new pages and new API endpoints.

The primary technical addition is charting. shadcn/ui has built-in chart components that wrap Recharts, so the charting library is already compatible with the existing design system. For CSV export, a lightweight client-side approach using native Blob/URL APIs is sufficient given the expected dataset sizes (hundreds to low thousands of rows). No additional CSV library is needed.

The API side requires new admin-scoped endpoints for dashboard stats aggregation, user CRUD, payment listing, settings management, and activity log querying. All follow the existing pattern: Express 5 routes behind requireAuth + requireAdmin middleware, Prisma queries, Zod validators.

**Primary recommendation:** Use shadcn/ui's built-in chart component (backed by Recharts) for bar and donut charts, reuse existing table/filter patterns for user and billing management pages, implement CSV export as a simple client-side utility function, and store platform settings in a new SystemSetting key-value model.

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | ^8.21.3 | Data tables for users, payments, activity logs | Already used for content tables |
| @tanstack/react-query | ^5.75.5 | Server state management for all data fetching | Already used throughout admin |
| date-fns | ^4.1.0 | Date formatting, period calculations | Already installed in admin |
| lucide-react | ^0.511.0 | Icons for stat cards, nav items | Already used throughout admin |
| shadcn/ui components | latest | Card, Table, Select, Dialog, etc. | Already installed, dark theme configured |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts | ^2.15 | Bar chart, pie/donut chart via shadcn chart component | Dashboard charts (ADMN-03) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js/react-chartjs-2 | Recharts is what shadcn/ui wraps; using Chart.js would fight the design system |
| Client-side CSV | papaparse/react-csv | Overkill for simple tabular export; native Blob API handles it in ~20 lines |
| SystemSetting model | .env file for settings | Settings need to be editable at runtime by admin without server restart |

### Installation

```bash
cd admin && npx shadcn@latest add chart
```

This installs Recharts and the shadcn ChartContainer/ChartTooltip/ChartLegend components. If React 19 causes peer dependency issues with recharts, add a `react-is` override in admin/package.json:

```json
"overrides": {
  "react-is": "^19.0.0"
}
```

## Architecture Patterns

### Recommended Project Structure

**API additions:**
```
api/src/
├── services/
│   ├── dashboard.service.ts      # Stats aggregation queries
│   ├── admin-user.service.ts     # User CRUD for admin
│   ├── admin-billing.service.ts  # Payment listing for admin
│   ├── settings.service.ts       # Platform settings CRUD
│   └── activity-log.service.ts   # Activity log queries + recording
├── routes/
│   ├── admin-dashboard.routes.ts # GET /api/admin/dashboard/*
│   ├── admin-user.routes.ts      # /api/admin/users/*
│   ├── admin-billing.routes.ts   # /api/admin/billing/*
│   ├── admin-settings.routes.ts  # /api/admin/settings/*
│   └── admin-activity.routes.ts  # /api/admin/activity-logs
└── validators/
    ├── admin-user.validators.ts
    ├── admin-billing.validators.ts
    └── admin-settings.validators.ts
```

**Admin panel additions:**
```
admin/src/
├── api/
│   ├── dashboard.ts          # Dashboard stats + chart data fetching
│   ├── users.ts              # User CRUD API client
│   ├── billing.ts            # Admin payment listing API client
│   ├── settings.ts           # Settings API client
│   └── activity-logs.ts      # Activity log API client
├── components/
│   ├── dashboard/
│   │   ├── StatCard.tsx      # Revenue, users, content, failed payments
│   │   ├── RevenueChart.tsx  # Bar chart (6/12 month)
│   │   ├── ContentChart.tsx  # Donut chart (content breakdown)
│   │   └── ActivityFeed.tsx  # Recent activity list
│   ├── users/
│   │   ├── UserTable.tsx     # TanStack Table for users
│   │   ├── UserForm.tsx      # Add/edit user dialog
│   │   └── UserStatsCards.tsx
│   ├── billing/
│   │   ├── PaymentTable.tsx  # TanStack Table for payments
│   │   └── BillingStatsCards.tsx
│   └── settings/
│       ├── MpesaSettings.tsx # Daraja API config + test button
│       ├── GeneralSettings.tsx
│       ├── PricingSettings.tsx
│       └── LimitSettings.tsx # Device/invite limits
├── routes/_authenticated/
│   ├── index.tsx             # Dashboard page (update existing)
│   ├── users/index.tsx       # Users management page
│   ├── billing/index.tsx     # Billing management page
│   ├── settings/index.tsx    # Settings page (replaces categories-only)
│   └── activity-logs/index.tsx # Activity logs page
├── hooks/
│   └── useTableFilters.ts    # Generic filter hook (generalization of useContentFilters)
└── lib/
    └── csv-export.ts         # CSV generation and download utility
```

### Pattern 1: Stat Card Component
**What:** Reusable card showing a metric with period comparison (e.g., "+12% vs last month")
**When to use:** Dashboard and management page headers
**Example:**
```typescript
// StatCard with period comparison
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;        // percentage change vs previous period
  changeLabel?: string;   // "vs last month"
  icon: LucideIcon;
  formatter?: (val: number) => string;
}

function StatCard({ title, value, change, changeLabel, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <p className={cn("text-xs", change >= 0 ? "text-green-500" : "text-red-500")}>
                {change >= 0 ? "+" : ""}{change}% {changeLabel}
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Pattern 2: Dashboard Stats API with Period Comparison
**What:** Single endpoint returns all dashboard metrics for current and previous period
**When to use:** Dashboard page initial load
**Example:**
```typescript
// API response shape
interface DashboardStats {
  revenue: { current: number; previous: number; change: number };
  activeUsers: { current: number; previous: number; change: number };
  totalContent: { current: number; previous: number; change: number };
  failedPayments: { current: number; previous: number; change: number };
}

// Service query pattern -- aggregate in one call
export async function getDashboardStats(periodDays: number = 30) {
  const now = new Date();
  const currentStart = subDays(now, periodDays);
  const previousStart = subDays(currentStart, periodDays);

  const [currentRevenue, previousRevenue] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "SUCCESS", createdAt: { gte: currentStart } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "SUCCESS", createdAt: { gte: previousStart, lt: currentStart } },
    }),
  ]);
  // ... similar for other stats
}
```

### Pattern 3: CSV Export Utility (Client-Side)
**What:** Convert array of objects to CSV and trigger download
**When to use:** Users page and billing page export buttons
**Example:**
```typescript
// lib/csv-export.ts
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string,
): void {
  const header = columns.map((c) => c.header).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        const str = val == null ? "" : String(val);
        // Escape quotes and wrap if contains comma/newline
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
```

### Pattern 4: Activity Log Recording
**What:** Middleware/helper that records admin CRUD actions to ActivityLog table
**When to use:** Wrap all admin mutation endpoints
**Example:**
```typescript
// services/activity-log.service.ts
export async function logActivity(params: {
  userId: string;
  action: string;        // "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "SETTINGS_CHANGE"
  entityType: string;    // "USER" | "CONTENT" | "PAYMENT" | "SETTINGS"
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  await prisma.activityLog.create({ data: params });
}
```

### Pattern 5: Settings Key-Value Store
**What:** Flexible settings storage using a SystemSetting model (key-value with JSON value)
**When to use:** M-Pesa credentials, pricing config, device/invite limits, general settings
**Example:**
```typescript
// Schema addition
model SystemSetting {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt
  updatedBy String?
}

// Service pattern
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  return setting ? (setting.value as T) : defaultValue;
}

export async function setSetting(key: string, value: unknown, adminId: string): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: value as Prisma.InputJsonValue, updatedBy: adminId },
    create: { key, value: value as Prisma.InputJsonValue, updatedBy: adminId },
  });
}
```

### Anti-Patterns to Avoid
- **N+1 queries in dashboard stats:** Do NOT run separate queries per stat card. Batch all aggregations in parallel with Promise.all.
- **Client-side aggregation:** Do NOT fetch all payments/users to the client and aggregate there. All stats computation belongs in the API.
- **Unprotected settings endpoints:** Do NOT expose M-Pesa credentials via GET. Mask sensitive fields (show last 4 chars only).
- **Activity logging in service layer:** Do NOT mix activity logging inside business services. Log at the route handler level after successful operations to keep services reusable.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Charts | Custom SVG/Canvas charts | shadcn/ui chart (Recharts) | Responsive, themed, accessible out of box |
| Data tables | Custom table with sort/filter | @tanstack/react-table (already installed) | Column defs, sorting state, manual pagination already proven in codebase |
| Date math | Manual date arithmetic | date-fns (already installed) | subDays, startOfMonth, format, etc. handle edge cases |
| CSV generation | Custom streaming CSV | Simple Blob-based utility | Dataset sizes (hundreds-thousands) don't need streaming |
| Form validation | Manual form checks | react-hook-form + Zod (already installed) | Consistent with existing admin forms |
| Toast notifications | Custom notification system | sonner (already installed) | Already used throughout admin panel |

**Key insight:** This phase introduces zero new UI paradigms. Every page follows existing patterns (PageContainer + stat cards + filter bar + data table). The only genuinely new element is charting, which shadcn handles.

## Common Pitfalls

### Pitfall 1: Recharts + React 19 Peer Dependency
**What goes wrong:** Recharts has a peer dependency on react-is which may not resolve with React 19.
**Why it happens:** Recharts bundles react-is which targets React 18.
**How to avoid:** Add `"overrides": { "react-is": "^19.0.0" }` to admin/package.json if npm install fails.
**Warning signs:** `npm install` errors mentioning react-is peer dependency conflict.

### Pitfall 2: Revenue Chart Date Grouping
**What goes wrong:** Revenue bar chart shows incorrect monthly grouping when timezone differs between server and client.
**Why it happens:** Prisma returns UTC timestamps; grouping by month must account for this.
**How to avoid:** Group by month in Prisma using raw SQL or use date-fns `startOfMonth` in the service layer after fetching. Keep all date grouping server-side.
**Warning signs:** Revenue bars showing on wrong months or duplicated months.

### Pitfall 3: Sensitive Settings Exposure
**What goes wrong:** M-Pesa API keys/secrets returned in plaintext via GET endpoint.
**Why it happens:** Naive implementation returns full setting values.
**How to avoid:** Never return full secret values. Mask to last 4 characters on read. Only accept full values on write. Store with a `sensitive` flag.
**Warning signs:** API response containing full API keys.

### Pitfall 4: Activity Log Table Performance
**What goes wrong:** Activity log query becomes slow as table grows.
**Why it happens:** Full-text search on `details` JSON column or missing index on `createdAt`.
**How to avoid:** The ActivityLog model already has `@@index([createdAt])` and `@@index([action])`. Use these for filtering. Don't search inside the JSON `details` column -- filter only by action, entityType, userId, and date range.
**Warning signs:** Slow query times on activity logs page.

### Pitfall 5: CSV Export Memory on Large Datasets
**What goes wrong:** Exporting all users/payments fetches too much data into browser memory.
**Why it happens:** Client-side CSV means all data must be in memory.
**How to avoid:** For export, create a dedicated API endpoint that returns all matching records (no pagination) but with only the columns needed for CSV. Set a reasonable server-side limit (e.g., 10,000 rows). For the expected scale of this platform, this is more than sufficient.
**Warning signs:** Browser freezing during export.

### Pitfall 6: Dashboard Stats N+1 Queries
**What goes wrong:** Dashboard loads slowly because stats are fetched sequentially.
**Why it happens:** Each stat card makes its own API call.
**How to avoid:** Single `/api/admin/dashboard/stats` endpoint that runs all aggregations in parallel via `Promise.all` and returns all stats in one response.
**Warning signs:** Dashboard showing loading spinners that resolve one by one.

## Code Examples

### Revenue Bar Chart with shadcn/ui
```typescript
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const chartConfig = {
  revenue: { label: "Revenue (KES)", color: "hsl(var(--chart-1))" },
};

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}K`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

### Content Breakdown Donut Chart
```typescript
import { Pie, PieChart, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

const chartConfig = {
  movies: { label: "Movies", color: "hsl(var(--chart-1))" },
  series: { label: "Series", color: "hsl(var(--chart-2))" },
  documentaries: { label: "Documentaries", color: "hsl(var(--chart-3))" },
  channels: { label: "Channels", color: "hsl(var(--chart-4))" },
};

interface ContentChartProps {
  data: Array<{ type: string; count: number; fill: string }>;
}

export function ContentChart({ data }: ContentChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="type" innerRadius={60} outerRadius={100} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  );
}
```

### Admin User CRUD Service Pattern
```typescript
// Follows existing content service pattern
export async function listUsers(params: {
  search?: string;
  status?: "active" | "inactive";
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}) {
  const where: Prisma.UserWhereInput = {};
  if (params.status === "active") where.isActive = true;
  if (params.status === "inactive") where.isActive = false;
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [params.sortBy]: params.sortOrder },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        isActive: true, createdAt: true,
        _count: { select: { sessions: true, payments: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { data: users, total, page: params.page, totalPages: Math.ceil(total / params.limit) };
}
```

### M-Pesa Connection Test Endpoint
```typescript
// Test Daraja API connectivity without initiating a real payment
router.post("/mpesa/test", async (req, res) => {
  try {
    const mpesa = await getMpesaClient();
    // For mock: always succeed. For sandbox/production: attempt OAuth token fetch
    if (env.MPESA_ENVIRONMENT === "mock") {
      res.json({ success: true, message: "Mock M-Pesa client active" });
      return;
    }
    // The DarajaMpesaClient.getAccessToken() validates credentials
    // If it throws, credentials are invalid
    await (mpesa as any).getAccessToken();
    res.json({ success: true, message: "Daraja API connection successful" });
  } catch (error) {
    res.json({
      success: false,
      message: error instanceof Error ? error.message : "Connection failed",
    });
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom chart wrappers | shadcn/ui Chart component (Recharts) | shadcn v2+ (2024) | Use ChartContainer instead of raw Recharts |
| react-csv library | Native Blob + URL.createObjectURL | Always available | No dependency needed for simple CSV |
| Separate stats endpoints | Single aggregated dashboard endpoint | Best practice | One network round-trip for dashboard |

**Deprecated/outdated:**
- react-csv: Not needed for simple exports; native APIs suffice
- recharts v1: shadcn uses v2; v3 is in development but not yet stable

## Open Questions

1. **SystemSetting vs .env for M-Pesa credentials**
   - What we know: ADMN-11 requires admin to configure Daraja API credentials at runtime
   - What's unclear: Whether changing M-Pesa credentials should require a server restart
   - Recommendation: Use SystemSetting model for runtime config. The getMpesaClient factory should read from SystemSetting first, falling back to env vars. This allows admin UI configuration without restart.

2. **Activity log scope**
   - What we know: ADMN-12 requires audit trail of "all admin CRUD operations"
   - What's unclear: Whether to retroactively add logging to existing Phase 3 content CRUD routes
   - Recommendation: Add activity logging to all admin routes going forward (user CRUD, settings changes, billing actions). For existing content routes, add logging in this phase as well since it is straightforward (one logActivity call per route handler).

3. **Session monitoring depth**
   - What we know: ADMN-09 requires "session monitoring" on the users page
   - What's unclear: Whether this means viewing a user's active sessions, or real-time session tracking
   - Recommendation: Display active session count and list (device, IP, last active) per user. Reuse the existing Session model queries. Allow admin to terminate user sessions.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: admin panel structure, existing components, API patterns, Prisma schema
- shadcn/ui official docs (https://ui.shadcn.com/docs/components/chart) - chart component uses Recharts

### Secondary (MEDIUM confidence)
- Recharts documentation (https://recharts.github.io/) - API, chart types, responsive container
- shadcn charts gallery (https://ui.shadcn.com/charts) - chart examples and patterns

### Tertiary (LOW confidence)
- WebSearch for React 19 + Recharts compatibility - react-is override may be needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed except recharts (added via shadcn chart)
- Architecture: HIGH - follows established patterns from existing admin panel code
- Pitfalls: HIGH - based on direct codebase analysis and known React 19 issues
- Charts: MEDIUM - shadcn chart component confirmed but Recharts v3 migration ongoing

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable domain, unlikely to change)
