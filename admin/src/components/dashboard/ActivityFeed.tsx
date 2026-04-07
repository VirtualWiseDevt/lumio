import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getRecentActivity,
  type ActivityFeedItem,
} from "@/api/dashboard";

interface ActivityFeedProps {
  period?: string;
}

function formatAction(action: string): string {
  return action.toLowerCase().replace(/_/g, " ");
}

function formatDetail(item: ActivityFeedItem): string {
  const entity = item.entityType.toLowerCase().replace(/_/g, " ");
  const id = item.entityId ? item.entityId.slice(0, 8) + "..." : "";
  return `${entity}${id ? " " + id : ""}`;
}

export function ActivityFeed({ period = "month" }: ActivityFeedProps) {
  const [page, setPage] = useState(1);

  const queryParams = {
    page,
    limit: 10,
    period: period as "week" | "month" | "quarter" | "all",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["recent-activity", queryParams],
    queryFn: () => getRecentActivity(queryParams),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No activity found for this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Time
                  </th>
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Admin
                  </th>
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Action
                  </th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                      {format(new Date(item.createdAt), "MMM d, HH:mm")}
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {item.user?.name || "System"}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
                        {formatAction(item.action)}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {formatDetail(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
