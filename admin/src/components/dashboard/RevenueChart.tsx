import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>;
  loading?: boolean;
  onMonthsChange?: (months: number) => void;
}

const chartConfig = {
  revenue: {
    label: "Revenue (KES)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

function formatYAxisTick(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export function RevenueChart({
  data,
  loading = false,
  onMonthsChange,
}: RevenueChartProps) {
  const [months, setMonths] = useState<6 | 12>(6);

  const handleMonthsChange = (value: 6 | 12) => {
    setMonths(value);
    onMonthsChange?.(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <CardAction>
          <div className="flex gap-1">
            <Button
              variant={months === 6 ? "default" : "outline"}
              size="xs"
              onClick={() => handleMonthsChange(6)}
            >
              6M
            </Button>
            <Button
              variant={months === 12 ? "default" : "outline"}
              size="xs"
              onClick={() => handleMonthsChange(12)}
            >
              12M
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxisTick}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    `KES ${Number(value).toLocaleString()}`
                  }
                />
              }
            />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
