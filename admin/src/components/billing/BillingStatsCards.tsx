import { DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BillingStats } from "@/api/billing";

interface BillingStatsCardsProps {
  stats: BillingStats | undefined;
  loading: boolean;
}

const cardDefs = [
  {
    key: "totalRevenue" as const,
    label: "Total Revenue",
    icon: DollarSign,
    prefix: "KES ",
    color: "text-emerald-500",
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-500/10",
  },
  {
    key: "successfulPayments" as const,
    label: "Successful Payments",
    icon: CheckCircle,
    prefix: "",
    color: "text-blue-500",
    border: "border-l-blue-500",
    iconBg: "bg-blue-500/10",
  },
  {
    key: "failedPayments" as const,
    label: "Failed Payments",
    icon: XCircle,
    prefix: "",
    color: "text-red-500",
    border: "border-l-red-500",
    iconBg: "bg-red-500/10",
  },
  {
    key: "pendingPayments" as const,
    label: "Pending Payments",
    icon: Clock,
    prefix: "",
    color: "text-amber-500",
    border: "border-l-amber-500",
    iconBg: "bg-amber-500/10",
  },
] as const;

function formatChange(change: number): { text: string; className: string } {
  const sign = change >= 0 ? "+" : "";
  const className = change >= 0 ? "text-green-500" : "text-red-500";
  return { text: `${sign}${change.toFixed(1)}%`, className };
}

export function BillingStatsCards({ stats, loading }: BillingStatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cardDefs.map((c) => (
          <Card key={c.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="mt-1 h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cardDefs.map((c) => {
        const Icon = c.icon;
        const stat = stats[c.key];
        const change = formatChange(stat.change);
        const value =
          c.prefix +
          stat.current.toLocaleString("en-KE", {
            maximumFractionDigits: 0,
          });

        return (
          <Card key={c.key} className={`border-l-4 ${c.border}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${c.iconBg}`}>
                <Icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
              <p className={`text-xs ${change.className}`}>
                {change.text} from previous period
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
