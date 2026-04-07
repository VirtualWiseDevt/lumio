import { useState, useMemo, useCallback } from "react";
import { createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { X } from "lucide-react";
import { authenticatedRoute } from "@/routes/_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Pagination } from "@/components/shared/Pagination";
import { ActivityLogTable } from "@/components/activity-logs/ActivityLogTable";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listActivityLogs } from "@/api/activity-logs";

const PAGE_SIZE = 20;

export const activityLogsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/activity-logs",
  component: ActivityLogsPage,
});

function ActivityLogsPage() {
  // Filter state
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Sorting state for table
  const sorting: SortingState = useMemo(
    () => [{ id: "createdAt", desc: sortOrder === "desc" }],
    [sortOrder],
  );

  const handleSortingChange = useCallback((newSorting: SortingState) => {
    if (newSorting.length > 0) {
      setSortOrder(newSorting[0].desc ? "desc" : "asc");
    }
  }, []);

  // Query
  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-activity-logs",
      actionFilter,
      entityTypeFilter,
      startDate,
      endDate,
      page,
      sortOrder,
    ],
    queryFn: () =>
      listActivityLogs({
        action: actionFilter !== "all" ? actionFilter : undefined,
        entityType: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: PAGE_SIZE,
        sortOrder,
      }),
  });

  return (
    <PageContainer title="Activity Logs">
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={actionFilter}
            onValueChange={(v) => {
              setActionFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="CREATE">Create</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="SETTINGS_CHANGE">Settings Change</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={entityTypeFilter}
            onValueChange={(v) => {
              setEntityTypeFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="CONTENT">Content</SelectItem>
              <SelectItem value="PAYMENT">Payment</SelectItem>
              <SelectItem value="SETTINGS">Settings</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-40"
            placeholder="Start date"
          />

          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-40"
            placeholder="End date"
          />

          {(actionFilter !== "all" || entityTypeFilter !== "all" || startDate !== "" || endDate !== "") && (
            <button
              onClick={() => {
                setActionFilter("all");
                setEntityTypeFilter("all");
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
              className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear Filters
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading activity logs...
          </div>
        ) : (
          <ActivityLogTable
            data={data?.data ?? []}
            sorting={sorting}
            onSortingChange={handleSortingChange}
          />
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>
    </PageContainer>
  );
}
