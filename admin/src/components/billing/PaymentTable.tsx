import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { AdminPayment } from "@/api/billing";

interface PaymentTableProps {
  data: AdminPayment[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  loading: boolean;
}

const statusStyles: Record<string, string> = {
  COMPLETED: "border-green-600 text-green-500",
  FAILED: "border-red-600 text-red-500",
  PENDING: "border-yellow-600 text-yellow-500",
  REFUNDED: "border-gray-600 text-gray-500",
};

function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export function PaymentTable({
  data,
  sorting,
  onSortingChange,
  loading,
}: PaymentTableProps) {
  const columns = useMemo<ColumnDef<AdminPayment>[]>(
    () => [
      {
        id: "user",
        header: "User",
        enableSorting: false,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.user.email}
            </p>
          </div>
        ),
      },
      {
        id: "plan",
        header: "Plan",
        enableSorting: false,
        cell: ({ row }) => row.original.plan.name,
      },
      {
        accessorKey: "amount",
        header: "Amount",
        enableSorting: true,
        cell: ({ row }) => formatKES(row.original.amount),
      },
      {
        accessorKey: "discount",
        header: "Discount",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.discount > 0
            ? formatKES(row.original.discount)
            : "-",
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: true,
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant="outline"
              className={statusStyles[status] ?? ""}
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "method",
        header: "Method",
        enableSorting: false,
      },
      {
        accessorKey: "mpesaReceiptNumber",
        header: "M-Pesa Receipt",
        enableSorting: false,
        cell: ({ row }) => row.original.mpesaReceiptNumber ?? "-",
      },
      {
        accessorKey: "phoneNumber",
        header: "Phone",
        enableSorting: false,
        cell: ({ row }) => row.original.phoneNumber ?? "-",
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        enableSorting: true,
        cell: ({ row }) =>
          format(new Date(row.original.createdAt), "MMM d, yyyy HH:mm"),
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(newSorting);
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className={cn(canSort && "cursor-pointer select-none")}
                    onClick={
                      canSort
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {canSort && (
                        <span className="ml-1">
                          {sorted === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                Loading payments...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No payments found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
