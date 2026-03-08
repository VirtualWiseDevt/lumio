import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface ContentChartProps {
  data: Array<{ type: string; count: number }>;
  loading?: boolean;
}

const chartConfig = {
  movies: {
    label: "Movies",
    color: "hsl(var(--chart-1))",
  },
  series: {
    label: "Series",
    color: "hsl(var(--chart-2))",
  },
  documentaries: {
    label: "Documentaries",
    color: "hsl(var(--chart-3))",
  },
  channels: {
    label: "Channels",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

function getColorForType(type: string): string {
  const key = type.toLowerCase();
  if (key in chartConfig) {
    return `var(--color-${key})`;
  }
  return "hsl(var(--chart-5))";
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
    fill: getColorForType(item.type),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[300px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="type" />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="type"
              innerRadius={60}
              outerRadius={100}
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent nameKey="type" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
