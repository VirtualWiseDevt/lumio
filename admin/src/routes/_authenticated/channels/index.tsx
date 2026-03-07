import { useState, useMemo } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { authenticatedRoute } from "../../_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { ContentGrid } from "@/components/content/ContentGrid";
import { ContentTable } from "@/components/content/ContentTable";
import { getChannelColumns } from "@/components/content/columns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listContent,
  deleteContent,
  publishContent,
  unpublishContent,
} from "@/api/content";
import type { Content } from "@/api/content";
import { listCategories } from "@/api/categories";
import { useContentFilters } from "@/hooks/useContentFilters";

const CONTENT_TYPE = "CHANNEL" as const;
const PAGE_SIZE = 20;

export const channelsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/channels",
  component: ChannelsPage,
});

function ChannelsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const filters = useContentFilters();
  const [deleteTarget, setDeleteTarget] = useState<Content | null>(null);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "content",
      CONTENT_TYPE,
      filters.status,
      filters.category,
      filters.debouncedSearch,
      filters.page,
      filters.sortBy,
      filters.sortOrder,
    ],
    queryFn: () =>
      listContent({
        type: CONTENT_TYPE,
        status: filters.status === "all" ? undefined : filters.status,
        category: filters.category,
        search: filters.debouncedSearch || undefined,
        page: filters.page,
        limit: PAGE_SIZE,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContent(id),
    onSuccess: () => {
      toast.success("Channel deleted successfully");
      void queryClient.invalidateQueries({
        queryKey: ["content", CONTENT_TYPE],
      });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Failed to delete channel");
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishContent(id),
    onSuccess: () => {
      toast.success("Channel published");
      void queryClient.invalidateQueries({
        queryKey: ["content", CONTENT_TYPE],
      });
    },
    onError: () => {
      toast.error("Failed to publish channel");
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => unpublishContent(id),
    onSuccess: () => {
      toast.success("Channel unpublished");
      void queryClient.invalidateQueries({
        queryKey: ["content", CONTENT_TYPE],
      });
    },
    onError: () => {
      toast.error("Failed to unpublish channel");
    },
  });

  const handleEdit = (content: Content) => {
    void navigate({ to: `/channels/${content.id}` as string });
  };

  const handleDelete = (content: Content) => {
    setDeleteTarget(content);
  };

  const sorting: SortingState = useMemo(
    () => [{ id: filters.sortBy, desc: filters.sortOrder === "desc" }],
    [filters.sortBy, filters.sortOrder],
  );

  const handleSortingChange = (newSorting: SortingState) => {
    if (newSorting.length > 0) {
      filters.setSortBy(newSorting[0].id);
      filters.setSortOrder(newSorting[0].desc ? "desc" : "asc");
    }
  };

  const columnActions = useMemo(
    () => ({
      onEdit: handleEdit,
      onDelete: handleDelete,
      onPublish: (content: Content) => publishMutation.mutate(content.id),
      onUnpublish: (content: Content) => unpublishMutation.mutate(content.id),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const columns = useMemo(
    () => getChannelColumns(columnActions),
    [columnActions],
  );

  return (
    <PageContainer title="TV Channels">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <FilterBar
            status={filters.status}
            onStatusChange={filters.setStatus}
            category={filters.category}
            onCategoryChange={filters.setCategory}
            search={filters.search}
            onSearchChange={filters.setSearch}
            viewMode={filters.viewMode}
            onViewModeChange={filters.setViewMode}
            categories={categoriesData ?? []}
          />
          <Button
            className="ml-4 shrink-0"
            onClick={() =>
              void navigate({ to: "/channels/new" as string })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Channel
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filters.viewMode === "grid" ? (
          <ContentGrid
            data={data?.data ?? []}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <ContentTable
            data={data?.data ?? []}
            columns={columns}
            sorting={sorting}
            onSortingChange={handleSortingChange}
          />
        )}

        {data && data.totalPages > 1 && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            limit={PAGE_SIZE}
            onPageChange={filters.setPage}
          />
        )}
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
