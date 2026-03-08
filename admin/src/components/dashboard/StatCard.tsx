import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: LucideIcon;
  loading?: boolean;
  formatCurrency?: boolean;
}

const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  loading = false,
  formatCurrency = false,
}: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-md" />
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
    <Card>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="rounded-md bg-muted p-2">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold">{displayValue}</p>
        <div className="mt-1 flex items-center gap-1 text-xs">
          {isPositive && (
            <ArrowUp className="size-3 text-emerald-500" />
          )}
          {isNegative && (
            <ArrowDown className="size-3 text-red-500" />
          )}
          {isZero && (
            <Minus className="size-3 text-muted-foreground" />
          )}
          <span
            className={cn(
              "font-medium",
              isPositive && "text-emerald-500",
              isNegative && "text-red-500",
              isZero && "text-muted-foreground",
            )}
          >
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-muted-foreground">{changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
