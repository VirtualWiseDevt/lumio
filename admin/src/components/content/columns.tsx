import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Content } from "@/api/content";

interface ColumnActions {
  onEdit: (content: Content) => void;
  onDelete: (content: Content) => void;
  onPublish: (content: Content) => void;
  onUnpublish: (content: Content) => void;
}

function createBaseColumns(actions: ColumnActions): ColumnDef<Content>[] {
  return [
    {
      id: "poster",
      header: "",
      size: 60,
      enableSorting: false,
      cell: ({ row }) => {
        const content = row.original;
        const posterUrl = content.posterPortrait
          ? `/api/media/${content.posterPortrait}`
          : null;
        return (
          <div className="h-12 w-8 overflow-hidden rounded bg-muted">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={content.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-[8px] text-muted-foreground">N/A</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      enableSorting: true,
    },
    {
      accessorKey: "releaseYear",
      header: "Year",
      enableSorting: true,
      cell: ({ getValue }) => getValue<number | null>() ?? "-",
    },
  ];
}

function createStatusColumn(): ColumnDef<Content> {
  return {
    accessorKey: "isPublished",
    header: "Status",
    enableSorting: true,
    cell: ({ getValue }) => (
      <StatusBadge isPublished={getValue<boolean>()} />
    ),
  };
}

function createCategoriesColumn(): ColumnDef<Content> {
  return {
    accessorKey: "categories",
    header: "Categories",
    enableSorting: false,
    cell: ({ getValue }) => {
      const cats = getValue<string[]>();
      return cats.length > 0 ? (
        <span className="text-sm">{cats.join(", ")}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  };
}

function createDateColumn(): ColumnDef<Content> {
  return {
    accessorKey: "createdAt",
    header: "Added",
    enableSorting: true,
    cell: ({ getValue }) =>
      format(new Date(getValue<string>()), "MMM d, yyyy"),
  };
}

function createActionsColumn(actions: ColumnActions): ColumnDef<Content> {
  return {
    id: "actions",
    enableSorting: false,
    size: 50,
    cell: ({ row }) => {
      const content = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => actions.onEdit(content)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {content.isPublished ? (
              <DropdownMenuItem
                onClick={() => actions.onUnpublish(content)}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Unpublish
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => actions.onPublish(content)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Publish
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => actions.onDelete(content)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };
}

export function getMovieColumns(actions: ColumnActions): ColumnDef<Content>[] {
  return [
    ...createBaseColumns(actions),
    {
      accessorKey: "quality",
      header: "Quality",
      enableSorting: true,
      cell: ({ getValue }) => getValue<string | null>() ?? "-",
    },
    createStatusColumn(),
    createCategoriesColumn(),
    createDateColumn(),
    createActionsColumn(actions),
  ];
}

export function getDocumentaryColumns(
  actions: ColumnActions,
): ColumnDef<Content>[] {
  return [
    ...createBaseColumns(actions),
    {
      accessorKey: "quality",
      header: "Quality",
      enableSorting: true,
      cell: ({ getValue }) => getValue<string | null>() ?? "-",
    },
    createStatusColumn(),
    createCategoriesColumn(),
    createDateColumn(),
    createActionsColumn(actions),
  ];
}

export function getSeriesColumns(
  actions: ColumnActions,
): ColumnDef<Content>[] {
  return [
    ...createBaseColumns(actions),
    {
      id: "seasons",
      header: "Seasons",
      enableSorting: false,
      cell: ({ row }) => {
        const count = row.original._count?.seasons ?? 0;
        return (
          <span className="text-sm">
            {count} season{count !== 1 ? "s" : ""}
          </span>
        );
      },
    },
    createStatusColumn(),
    createCategoriesColumn(),
    createDateColumn(),
    createActionsColumn(actions),
  ];
}

export function getChannelColumns(
  actions: ColumnActions,
): ColumnDef<Content>[] {
  return [
    ...createBaseColumns(actions),
    {
      accessorKey: "streamUrl",
      header: "Stream URL",
      enableSorting: false,
      cell: ({ getValue }) => {
        const url = getValue<string | null>();
        return url ? (
          <span className="max-w-48 truncate text-sm">{url}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    createStatusColumn(),
    createCategoriesColumn(),
    createDateColumn(),
    createActionsColumn(actions),
  ];
}
