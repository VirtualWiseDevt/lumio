import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, Film, AlertTriangle } from "lucide-react";
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

export const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/",
  component: DashboardPage,
});

function DashboardPage() {
  const [periodDays] = useState(30);
  const [months, setMonths] = useState(6);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", periodDays],
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
        {/* Row 1: Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Revenue"
            value={stats?.revenue.current ?? 0}
            change={stats?.revenue.change ?? 0}
            changeLabel="vs last period"
            icon={DollarSign}
            loading={statsLoading}
            formatCurrency
          />
          <StatCard
            title="Active Users"
            value={stats?.activeUsers.current ?? 0}
            change={stats?.activeUsers.change ?? 0}
            changeLabel="vs last period"
            icon={Users}
            loading={statsLoading}
          />
          <StatCard
            title="Total Content"
            value={stats?.totalContent.current ?? 0}
            change={stats?.totalContent.change ?? 0}
            changeLabel="vs last period"
            icon={Film}
            loading={statsLoading}
          />
          <StatCard
            title="Failed Payments"
            value={stats?.failedPayments.current ?? 0}
            change={stats?.failedPayments.change ?? 0}
            changeLabel="vs last period"
            icon={AlertTriangle}
            loading={statsLoading}
          />
        </div>

        {/* Row 2: Charts */}
        <div className="grid gap-4 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <RevenueChart
              data={revenueData ?? []}
              loading={revenueLoading}
              onMonthsChange={setMonths}
            />
          </div>
          <div className="lg:col-span-3">
            <ContentChart
              data={contentData ?? []}
              loading={contentLoading}
            />
          </div>
        </div>

        {/* Row 3: Activity Feed */}
        <ActivityFeed />
      </div>
    </PageContainer>
  );
}
