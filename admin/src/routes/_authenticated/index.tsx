import { useState, useMemo, useCallback } from "react";
import { createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, Film, AlertTriangle, X } from "lucide-react";
import { authenticatedRoute } from "../_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ContentChart } from "@/components/dashboard/ContentChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import {
  getDashboardStats,
  getRevenueChart,
  getContentBreakdown,
} from "@/api/dashboard";
import { cn } from "@/lib/utils";

export const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/",
  component: DashboardPage,
});

type PeriodKey = "week" | "month" | "quarter" | "all" | "custom";

const PERIOD_OPTIONS: { key: PeriodKey; label: string; days: number | null }[] = [
  { key: "week", label: "This Week", days: 7 },
  { key: "month", label: "This Month", days: 30 },
  { key: "quarter", label: "This Quarter", days: 90 },
  { key: "all", label: "All Time", days: null },
];

function DashboardPage() {
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [appliedCustomStart, setAppliedCustomStart] = useState("");
  const [appliedCustomEnd, setAppliedCustomEnd] = useState("");
  const [months, setMonths] = useState(6);

  const periodDays = useMemo(() => {
    if (period === "custom") {
      // For custom range, compute days between applied dates
      if (appliedCustomStart && appliedCustomEnd) {
        const start = new Date(appliedCustomStart);
        const end = new Date(appliedCustomEnd);
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : undefined;
      }
      return undefined;
    }
    if (period === "all") return undefined;
    return PERIOD_OPTIONS.find((p) => p.key === period)?.days ?? undefined;
  }, [period, appliedCustomStart, appliedCustomEnd]);

  const handleApplyCustom = useCallback(() => {
    if (customStart && customEnd) {
      setAppliedCustomStart(customStart);
      setAppliedCustomEnd(customEnd);
    }
  }, [customStart, customEnd]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", period, periodDays, appliedCustomStart, appliedCustomEnd],
    queryFn: () => getDashboardStats(periodDays),
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["revenue-chart", months],
    queryFn: () => getRevenueChart(months),
  });

  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: ["content-breakdown"],
    queryFn: () => getContentBreakdown(),
  });

  return (
    <PageContainer title="Dashboard">
      <div className="space-y-6">
        {/* Period filter pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  period === opt.key
                    ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => setPeriod("custom")}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                period === "custom"
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              Custom
            </button>
          </div>

          {period !== "month" && (
            <button
              onClick={() => {
                setPeriod("month");
                setCustomStart("");
                setCustomEnd("");
                setAppliedCustomStart("");
                setAppliedCustomEnd("");
              }}
              className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear Filters
            </button>
          )}

          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
              />
              <button
                onClick={handleApplyCustom}
                disabled={!customStart || !customEnd}
                className="h-8 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Row 1: Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="TOTAL REVENUE"
            value={stats?.revenue.current ?? 0}
            change={stats?.revenue.change ?? 0}
            changeLabel="vs last period"
            icon={DollarSign}
            loading={statsLoading}
            formatCurrency
            accent="amber"
          />
          <StatCard
            title="ACTIVE USERS"
            value={stats?.activeUsers.current ?? 0}
            change={stats?.activeUsers.change ?? 0}
            changeLabel="vs last period"
            icon={Users}
            loading={statsLoading}
            accent="blue"
          />
          <StatCard
            title="TOTAL CONTENT"
            value={stats?.totalContent.current ?? 0}
            change={stats?.totalContent.change ?? 0}
            changeLabel="vs last period"
            icon={Film}
            loading={statsLoading}
            accent="emerald"
          />
          <StatCard
            title="FAILED PAYMENTS"
            value={stats?.failedPayments.current ?? 0}
            change={stats?.failedPayments.change ?? 0}
            changeLabel="vs last period"
            icon={AlertTriangle}
            loading={statsLoading}
            accent="red"
          />
        </div>

        {/* Row 2: Charts — equal height */}
        <div className="flex gap-4 items-stretch">
          <div className="flex-1 min-w-0">
            <RevenueChart
              data={revenueData ?? []}
              loading={revenueLoading}
              onMonthsChange={setMonths}
            />
          </div>
          <div className="w-[380px] flex-shrink-0">
            <ContentChart
              data={contentData ?? []}
              loading={contentLoading}
            />
          </div>
        </div>

        {/* Row 3: Activity Feed */}
        <ActivityFeed period={period} />
      </div>
    </PageContainer>
  );
}
