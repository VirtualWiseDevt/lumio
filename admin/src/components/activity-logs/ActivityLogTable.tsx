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
import type { ActivityLogEntry } from "@/api/activity-logs";

interface ActivityLogTableProps {
  data: ActivityLogEntry[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-600 text-white hover:bg-green-700",
  UPDATE: "bg-blue-600 text-white hover:bg-blue-700",
  DELETE: "bg-red-600 text-white hover:bg-red-700",
  LOGIN: "bg-purple-600 text-white hover:bg-purple-700",
  SETTINGS_CHANGE: "bg-yellow-600 text-white hover:bg-yellow-700",
};

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

export function ActivityLogTable({
  data,
  sorting,
  onSortingChange,
}: ActivityLogTableProps) {
  const columns = useMemo<ColumnDef<ActivityLogEntry>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Timestamp",
        enableSorting: true,
        cell: ({ row }) =>
          format(new Date(row.original.createdAt), "MMM d, yyyy HH:mm:ss"),
      },
      {
        id: "admin",
        header: "Admin",
        enableSorting: false,
        cell: ({ row }) => row.original.user?.name ?? "System",
      },
      {
        accessorKey: "action",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => {
          const action = row.original.action;
          const colorClass = ACTION_COLORS[action] ?? "bg-gray-600 text-white";
          return <Badge className={colorClass}>{action}</Badge>;
        },
      },
      {
        accessorKey: "entityType",
        header: "Entity Type",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.entityType}</Badge>
        ),
      },
      {
        accessorKey: "entityId",
        header: "Entity ID",
        enableSorting: false,
        cell: ({ row }) => {
          const id = row.original.entityId;
          if (!id) return <span className="text-muted-foreground">-</span>;
          return (
            <span className="font-mono text-xs" title={id}>
              {truncate(id, 12)}
            </span>
          );
        },
      },
      {
        id: "details",
        header: "Details",
        enableSorting: false,
        cell: ({ row }) => {
          const details = row.original.details;
          if (!details)
            return <span className="text-muted-foreground">-</span>;
          const json = JSON.stringify(details);
          return (
            <span className="text-xs text-muted-foreground" title={json}>
              {truncate(json, 100)}
            </span>
          );
        },
      },
      {
        accessorKey: "ipAddress",
        header: "IP Address",
        enableSorting: false,
        cell: ({ row }) => {
          const ip = row.original.ipAddress;
          if (!ip) return <span className="text-muted-foreground">-</span>;
          return <span className="font-mono text-xs">{ip}</span>;
        },
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
          {table.getRowModel().rows.length > 0 ? (
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
                No activity logs found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
