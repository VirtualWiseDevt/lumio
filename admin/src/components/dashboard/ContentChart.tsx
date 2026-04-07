import { Pie, PieChart, Cell } from "recharts";
import {
  Card,
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
import { Skeleton } from "@/components/ui/skeleton";

interface ContentChartProps {
  data: Array<{ type: string; count: number }>;
  loading?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  movie: "#f59e0b",
  movies: "#f59e0b",
  series: "#3b82f6",
  documentary: "#22c55e",
  documentaries: "#22c55e",
  channel: "#ef4444",
  channels: "#ef4444",
};

const chartConfig = {
  movies: { label: "Movies", color: "#f59e0b" },
  series: { label: "Series", color: "#3b82f6" },
  documentaries: { label: "Documentaries", color: "#22c55e" },
  channels: { label: "Channels", color: "#ef4444" },
} satisfies ChartConfig;

function getColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] || "#6b7280";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ContentChart({ data, loading = false }: ContentChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="mx-auto h-[300px] w-[300px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    type: item.type.toLowerCase(),
    fill: getColor(item.type),
  }));

  const total = chartData.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Content Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center">
        <div className="flex items-center gap-6 w-full">
          <ChartContainer config={chartConfig} className="aspect-square h-[200px] flex-shrink-0">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="type" />} />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="type"
                innerRadius={50}
                outerRadius={85}
                strokeWidth={2}
                stroke="hsl(var(--card))"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Legend with counts */}
          <div className="flex flex-col gap-3">
            {chartData.map((item) => (
              <div key={item.type} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-sm text-foreground">
                  {capitalize(item.type)}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  ({item.count})
                </span>
              </div>
            ))}
            {total > 0 && (
              <div className="mt-1 border-t border-border pt-2 text-xs text-muted-foreground">
                {total} total
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
