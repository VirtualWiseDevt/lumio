import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { Search, Download } from "lucide-react";
import { toast } from "sonner";
import { authenticatedRoute } from "@/routes/_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Pagination } from "@/components/shared/Pagination";
import { BillingStatsCards } from "@/components/billing/BillingStatsCards";
import { PaymentTable } from "@/components/billing/PaymentTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBillingStats, listPayments } from "@/api/billing";
import type { AdminPayment } from "@/api/billing";
import { exportToCsv } from "@/lib/csv-export";

const PAGE_SIZE = 20;

export const billingRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/billing",
  component: BillingPage,
});

function BillingPage() {
  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Query billing stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-billing-stats"],
    queryFn: () => getBillingStats(),
  });

  // Query payments
  const statusParam =
    statusFilter === "all" ? undefined : statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-payments",
      debouncedSearch,
      statusFilter,
      startDate,
      endDate,
      page,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      listPayments({
        search: debouncedSearch || undefined,
        status: statusParam,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder,
      }),
  });

  // Sorting
  const sorting: SortingState = useMemo(
    () => [{ id: sortBy, desc: sortOrder === "desc" }],
    [sortBy, sortOrder],
  );

  const handleSortingChange = useCallback((newSorting: SortingState) => {
    if (newSorting.length > 0) {
      setSortBy(newSorting[0].id);
      setSortOrder(newSorting[0].desc ? "desc" : "asc");
    }
  }, []);

  // CSV export - flatten nested objects for CSV columns
  type FlatPayment = {
    userName: string;
    userEmail: string;
    planName: string;
    amount: number;
    discount: number;
    status: string;
    method: string;
    mpesaReceiptNumber: string;
    phoneNumber: string;
    createdAt: string;
  };

  const handleExport = useCallback(() => {
    if (!data?.data.length) {
      toast.error("No data to export");
      return;
    }

    const flatData: FlatPayment[] = data.data.map((p: AdminPayment) => ({
      userName: p.user.name,
      userEmail: p.user.email,
      planName: p.plan.name,
      amount: p.amount,
      discount: p.discount,
      status: p.status,
      method: p.method,
      mpesaReceiptNumber: p.mpesaReceiptNumber ?? "",
      phoneNumber: p.phoneNumber ?? "",
      createdAt: p.createdAt,
    }));

    exportToCsv(
      flatData,
      [
        { key: "userName", header: "User" },
        { key: "userEmail", header: "Email" },
        { key: "planName", header: "Plan" },
        { key: "amount", header: "Amount" },
        { key: "discount", header: "Discount" },
        { key: "status", header: "Status" },
        { key: "method", header: "Method" },
        { key: "mpesaReceiptNumber", header: "Receipt" },
        { key: "phoneNumber", header: "Phone" },
        { key: "createdAt", header: "Date" },
      ],
      "payments",
    );
    toast.success("Payments exported to CSV");
  }, [data?.data]);

  return (
    <PageContainer title="Billing">
      <div className="space-y-6">
        {/* Stats */}
        <BillingStatsCards stats={stats} loading={statsLoading} />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-36"
            placeholder="Start date"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-36"
            placeholder="End date"
          />

          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Payment Table */}
        <PaymentTable
          data={data?.data ?? []}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          loading={isLoading}
        />

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
