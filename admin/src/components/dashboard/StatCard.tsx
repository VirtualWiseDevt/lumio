import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AccentColor = "amber" | "blue" | "emerald" | "red";

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: LucideIcon;
  loading?: boolean;
  formatCurrency?: boolean;
  accent?: AccentColor;
}

const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const accentStyles: Record<AccentColor, { border: string; iconBg: string; iconText: string }> = {
  amber: { border: "border-l-amber-500", iconBg: "bg-amber-500/10", iconText: "text-amber-500" },
  blue: { border: "border-l-blue-500", iconBg: "bg-blue-500/10", iconText: "text-blue-500" },
  emerald: { border: "border-l-emerald-500", iconBg: "bg-emerald-500/10", iconText: "text-emerald-500" },
  red: { border: "border-l-red-500", iconBg: "bg-red-500/10", iconText: "text-red-500" },
};

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  loading = false,
  formatCurrency = false,
  accent = "blue",
}: StatCardProps) {
  const colors = accentStyles[accent];

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-2 h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const displayValue = formatCurrency
    ? currencyFormatter.format(typeof value === "string" ? parseFloat(value) : value)
    : typeof value === "number"
      ? value.toLocaleString()
      : value;

  const isPositive = change > 0;
  const isNegative = change < 0;
  const isZero = change === 0;

  return (
    <Card className={cn("border-l-4", colors.border)}>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className={cn("rounded-lg p-2", colors.iconBg)}>
            <Icon className={cn("size-4", colors.iconText)} />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold">{displayValue}</p>
        <div className="mt-1 flex items-center gap-1 text-xs">
          {isPositive && <ArrowUp className="size-3 text-emerald-500" />}
          {isNegative && <ArrowDown className="size-3 text-red-500" />}
          {isZero && <Minus className="size-3 text-muted-foreground" />}
          <span
            className={cn(
              "font-medium",
              isPositive && "text-emerald-500",
              isNegative && "text-red-500",
              isZero && "text-muted-foreground",
            )}
          >
            {isPositive ? "+" : ""}{Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-muted-foreground">{changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
