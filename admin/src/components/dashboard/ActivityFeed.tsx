import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  UserPlus,
  Pencil,
  Trash2,
  LogIn,
  Settings,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getRecentActivity,
  type ActivityFeedItem,
} from "@/api/dashboard";

type Period = "week" | "month" | "quarter" | "all" | "custom";

const periodLabels: Record<Period, string> = {
  week: "This Week",
  month: "This Month",
  quarter: "This Quarter",
  all: "All Time",
  custom: "Custom Range",
};

const actionIcons: Record<string, typeof Activity> = {
  CREATE: UserPlus,
  UPDATE: Pencil,
  DELETE: Trash2,
  LOGIN: LogIn,
  SETTINGS_CHANGE: Settings,
};

function getActionIcon(action: string) {
  return actionIcons[action] || Activity;
}

function formatDescription(item: ActivityFeedItem): string {
  const userName = item.user?.name || "System";
  const action = item.action.toLowerCase().replace("_", " ");
  const entity = item.entityType.toLowerCase().replace("_", " ");
  const entityId = item.entityId ? ` ${item.entityId.slice(0, 8)}...` : "";
  return `${userName} ${action} ${entity}${entityId}`;
}

export function ActivityFeed() {
  const [period, setPeriod] = useState<Period>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [page, setPage] = useState(1);

  const queryParams = {
    page,
    limit: 10,
    period,
    ...(period === "custom" && customStart ? { startDate: customStart } : {}),
    ...(period === "custom" && customEnd ? { endDate: customEnd } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["recent-activity", queryParams],
    queryFn: () => getRecentActivity(queryParams),
  });

  const handlePeriodChange = (value: string) => {
    setPeriod(value as Period);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardAction>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[150px]" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(periodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>

      {period === "custom" && (
        <CardContent className="pb-0 pt-0">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
            />
          </div>
        </CardContent>
      )}

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.data.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No activity found for this period.
          </p>
        ) : (
          <div className="space-y-4">
            {data.data.map((item) => {
              const Icon = getActionIcon(item.action);
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-tight">
                      {formatDescription(item)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Page {data.page} of {data.totalPages} ({data.total} total)
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
