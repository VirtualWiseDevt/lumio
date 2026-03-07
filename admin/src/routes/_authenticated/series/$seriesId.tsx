import { useState } from "react";
import { createRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Loader2,
  Tv,
} from "lucide-react";
import { toast } from "sonner";
import { authenticatedRoute } from "../../_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SeriesForm } from "@/components/forms/SeriesForm";
import { getContent } from "@/api/content";
import {
  listSeasons,
  createSeason,
  updateSeason,
  deleteSeason,
} from "@/api/seasons";
import type { Season } from "@/api/seasons";

export const seriesDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/series/$seriesId",
  component: SeriesDetailPage,
});

function SeriesDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { seriesId?: string };
  const seriesId = params.seriesId ?? "";
  const queryClient = useQueryClient();

  const [showAddSeason, setShowAddSeason] = useState(false);
  const [editSeason, setEditSeason] = useState<Season | null>(null);
  const [deletingSeasonTarget, setDeletingSeasonTarget] =
    useState<Season | null>(null);
  const [seasonNumber, setSeasonNumber] = useState("");
  const [seasonTitle, setSeasonTitle] = useState("");

  // Fetch series data
  const {
    data: series,
    isLoading: seriesLoading,
    error: seriesError,
  } = useQuery({
    queryKey: ["content", seriesId],
    queryFn: () => getContent(seriesId),
    enabled: !!seriesId,
  });

  // Fetch seasons
  const { data: seasons, isLoading: seasonsLoading } = useQuery({
    queryKey: ["seasons", seriesId],
    queryFn: () => listSeasons(seriesId),
    enabled: !!seriesId,
  });

  // Create season
  const createSeasonMutation = useMutation({
    mutationFn: (data: { number: number; title?: string }) =>
      createSeason(seriesId, data),
    onSuccess: () => {
      toast.success("Season created");
      void queryClient.invalidateQueries({ queryKey: ["seasons", seriesId] });
      void queryClient.invalidateQueries({ queryKey: ["content", seriesId] });
      setShowAddSeason(false);
      setSeasonNumber("");
      setSeasonTitle("");
    },
    onError: () => {
      toast.error("Failed to create season");
    },
  });

  // Update season
  const updateSeasonMutation = useMutation({
    mutationFn: (data: { id: string; number: number; title?: string }) =>
      updateSeason(seriesId, data.id, {
        number: data.number,
        title: data.title || null,
      }),
    onSuccess: () => {
      toast.success("Season updated");
      void queryClient.invalidateQueries({ queryKey: ["seasons", seriesId] });
      setEditSeason(null);
      setSeasonNumber("");
      setSeasonTitle("");
    },
    onError: () => {
      toast.error("Failed to update season");
    },
  });

  // Delete season
  const deleteSeasonMutation = useMutation({
    mutationFn: (seasonId: string) => deleteSeason(seriesId, seasonId),
    onSuccess: () => {
      toast.success("Season deleted");
      void queryClient.invalidateQueries({ queryKey: ["seasons", seriesId] });
      void queryClient.invalidateQueries({ queryKey: ["content", seriesId] });
      setDeletingSeasonTarget(null);
    },
    onError: () => {
      toast.error("Failed to delete season");
    },
  });

  const handleAddSeason = () => {
    const num = parseInt(seasonNumber, 10);
    if (!num || num < 1) {
      toast.error("Please enter a valid season number");
      return;
    }
    createSeasonMutation.mutate({
      number: num,
      title: seasonTitle || undefined,
    });
  };

  const handleUpdateSeason = () => {
    if (!editSeason) return;
    const num = parseInt(seasonNumber, 10);
    if (!num || num < 1) {
      toast.error("Please enter a valid season number");
      return;
    }
    updateSeasonMutation.mutate({
      id: editSeason.id,
      number: num,
      title: seasonTitle || undefined,
    });
  };

  const openEditSeason = (season: Season) => {
    setEditSeason(season);
    setSeasonNumber(season.number.toString());
    setSeasonTitle(season.title ?? "");
  };

  const sortedSeasons = seasons
    ? [...seasons].sort((a, b) => a.number - b.number)
    : [];

  if (seriesLoading) {
    return (
      <PageContainer title="Series Detail">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (seriesError || !series) {
    return (
      <PageContainer title="Series Detail">
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void navigate({ to: "/series" as string })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Series
          </Button>
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">
              Series not found or failed to load.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={series.title}>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            className="hover:text-foreground"
            onClick={() => void navigate({ to: "/series" as string })}
          >
            Series
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{series.title}</span>
        </div>

        {/* Series Info Edit */}
        <Card>
          <CardHeader>
            <CardTitle>Series Information</CardTitle>
          </CardHeader>
          <CardContent>
            <SeriesForm mode="edit" defaultValues={series} />
          </CardContent>
        </Card>

        <Separator />

        {/* Seasons Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Seasons ({sortedSeasons.length})
            </h2>
            <Button onClick={() => setShowAddSeason(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Season
            </Button>
          </div>

          {seasonsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : sortedSeasons.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border">
              <div className="text-center">
                <Tv className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No seasons yet. Add a season to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSeasons.map((season) => (
                <Card key={season.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        S{season.number}
                      </div>
                      <div>
                        <p className="font-medium">
                          Season {season.number}
                          {season.title ? `: ${season.title}` : ""}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {season._count?.episodes ?? 0} episode
                          {(season._count?.episodes ?? 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void navigate({
                            to: `/series/${seriesId}/seasons/${season.id}` as string,
                          })
                        }
                      >
                        Manage Episodes
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditSeason(season)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingSeasonTarget(season)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Season Dialog */}
      <Dialog
        open={showAddSeason}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddSeason(false);
            setSeasonNumber("");
            setSeasonTitle("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Season</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="season-number">Season Number *</Label>
              <Input
                id="season-number"
                type="number"
                value={seasonNumber}
                onChange={(e) => setSeasonNumber(e.target.value)}
                placeholder="1"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="season-title">Title (optional)</Label>
              <Input
                id="season-title"
                value={seasonTitle}
                onChange={(e) => setSeasonTitle(e.target.value)}
                placeholder="e.g. The Beginning"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddSeason(false);
                setSeasonNumber("");
                setSeasonTitle("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSeason}
              disabled={createSeasonMutation.isPending}
            >
              {createSeasonMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Season
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Season Dialog */}
      <Dialog
        open={editSeason !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditSeason(null);
            setSeasonNumber("");
            setSeasonTitle("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Season</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-season-number">Season Number *</Label>
              <Input
                id="edit-season-number"
                type="number"
                value={seasonNumber}
                onChange={(e) => setSeasonNumber(e.target.value)}
                placeholder="1"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-season-title">Title (optional)</Label>
              <Input
                id="edit-season-title"
                value={seasonTitle}
                onChange={(e) => setSeasonTitle(e.target.value)}
                placeholder="e.g. The Beginning"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditSeason(null);
                setSeasonNumber("");
                setSeasonTitle("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSeason}
              disabled={updateSeasonMutation.isPending}
            >
              {updateSeasonMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Season Confirmation */}
      <AlertDialog
        open={deletingSeasonTarget !== null}
        onOpenChange={(open) => !open && setDeletingSeasonTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Season</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Season{" "}
              {deletingSeasonTarget?.number}
              {deletingSeasonTarget?.title
                ? ` (${deletingSeasonTarget.title})`
                : ""}
              ? This will also delete all its episodes. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() =>
                deletingSeasonTarget &&
                deleteSeasonMutation.mutate(deletingSeasonTarget.id)
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
