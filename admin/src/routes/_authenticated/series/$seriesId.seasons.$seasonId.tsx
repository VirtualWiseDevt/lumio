import { useState } from "react";
import { createRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Video,
  Film,
} from "lucide-react";
import { toast } from "sonner";
import { authenticatedRoute } from "../../_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EpisodeForm,
  type EpisodeFormData,
} from "@/components/forms/EpisodeForm";
import { getContent } from "@/api/content";
import {
  listSeasons,
  listEpisodes,
  createEpisode,
  updateEpisode,
  deleteEpisode,
} from "@/api/seasons";
import type { Episode } from "@/api/seasons";

export const seasonDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/series/$seriesId/seasons/$seasonId",
  component: SeasonDetailPage,
});

function SeasonDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as {
    seriesId?: string;
    seasonId?: string;
  };
  const seriesId = params.seriesId ?? "";
  const seasonId = params.seasonId ?? "";
  const queryClient = useQueryClient();

  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [deletingEpisode, setDeletingEpisode] = useState<Episode | null>(null);

  // Fetch series data (for breadcrumb)
  const { data: series } = useQuery({
    queryKey: ["content", seriesId],
    queryFn: () => getContent(seriesId),
    enabled: !!seriesId,
  });

  // Fetch seasons (to get current season info)
  const { data: seasons } = useQuery({
    queryKey: ["seasons", seriesId],
    queryFn: () => listSeasons(seriesId),
    enabled: !!seriesId,
  });

  const season = seasons?.find((s) => s.id === seasonId);

  // Fetch episodes
  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: ["episodes", seriesId, seasonId],
    queryFn: () => listEpisodes(seriesId, seasonId),
    enabled: !!seriesId && !!seasonId,
  });

  // Create episode
  const createEpisodeMutation = useMutation({
    mutationFn: (data: EpisodeFormData) =>
      createEpisode(seriesId, seasonId, {
        number: data.number,
        title: data.title,
        description: data.description ?? null,
        duration: data.duration ?? null,
        videoUrl: data.videoUrl ?? null,
        thumbnailUrl: data.thumbnailUrl ?? null,
      }),
    onSuccess: () => {
      toast.success("Episode added");
      void queryClient.invalidateQueries({
        queryKey: ["episodes", seriesId, seasonId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["seasons", seriesId],
      });
      setShowEpisodeForm(false);
    },
    onError: () => {
      toast.error("Failed to add episode");
    },
  });

  // Update episode
  const updateEpisodeMutation = useMutation({
    mutationFn: ({
      episodeId,
      data,
    }: {
      episodeId: string;
      data: EpisodeFormData;
    }) =>
      updateEpisode(seriesId, seasonId, episodeId, {
        number: data.number,
        title: data.title,
        description: data.description ?? null,
        duration: data.duration ?? null,
        videoUrl: data.videoUrl ?? null,
        thumbnailUrl: data.thumbnailUrl ?? null,
      }),
    onSuccess: () => {
      toast.success("Episode updated");
      void queryClient.invalidateQueries({
        queryKey: ["episodes", seriesId, seasonId],
      });
      setEditingEpisode(null);
    },
    onError: () => {
      toast.error("Failed to update episode");
    },
  });

  // Delete episode
  const deleteEpisodeMutation = useMutation({
    mutationFn: (episodeId: string) =>
      deleteEpisode(seriesId, seasonId, episodeId),
    onSuccess: () => {
      toast.success("Episode deleted");
      void queryClient.invalidateQueries({
        queryKey: ["episodes", seriesId, seasonId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["seasons", seriesId],
      });
      setDeletingEpisode(null);
    },
    onError: () => {
      toast.error("Failed to delete episode");
    },
  });

  const handleCreateEpisode = (data: EpisodeFormData) => {
    createEpisodeMutation.mutate(data);
  };

  const handleUpdateEpisode = (data: EpisodeFormData) => {
    if (!editingEpisode) return;
    updateEpisodeMutation.mutate({ episodeId: editingEpisode.id, data });
  };

  const sortedEpisodes = episodes
    ? [...episodes].sort((a, b) => a.number - b.number)
    : [];

  const seasonTitle = season
    ? `Season ${season.number}${season.title ? `: ${season.title}` : ""}`
    : "Season";

  if (episodesLoading) {
    return (
      <PageContainer title={seasonTitle}>
        <div className="space-y-6">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={seasonTitle}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            className="hover:text-foreground"
            onClick={() => void navigate({ to: "/series" as string })}
          >
            Series
          </button>
          <ChevronRight className="h-4 w-4" />
          <button
            className="hover:text-foreground"
            onClick={() =>
              void navigate({ to: `/series/${seriesId}` as string })
            }
          >
            {series?.title ?? "..."}
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{seasonTitle}</span>
        </div>

        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            void navigate({ to: `/series/${seriesId}` as string })
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {series?.title ?? "Series"}
        </Button>

        {/* Episodes header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Episodes ({sortedEpisodes.length})
          </h2>
          <Button onClick={() => setShowEpisodeForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Episode
          </Button>
        </div>

        {/* Episode list */}
        {sortedEpisodes.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border">
            <div className="text-center">
              <Film className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No episodes yet. Add an episode to get started.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-24">Duration</TableHead>
                  <TableHead className="w-28">Video</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEpisodes.map((episode) => (
                  <TableRow key={episode.id}>
                    <TableCell className="font-medium">
                      {episode.number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{episode.title}</p>
                        {episode.description && (
                          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                            {episode.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {episode.duration ? `${episode.duration} min` : "-"}
                    </TableCell>
                    <TableCell>
                      {episode.videoUrl ? (
                        <Badge
                          variant="secondary"
                          className="gap-1 text-green-400"
                        >
                          <Video className="h-3 w-3" />
                          Ready
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          No video
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingEpisode(episode)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingEpisode(episode)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Episode Dialog */}
      <EpisodeForm
        open={showEpisodeForm}
        mode="create"
        defaultValues={{
          number: sortedEpisodes.length > 0
            ? sortedEpisodes[sortedEpisodes.length - 1].number + 1
            : 1,
        }}
        onSubmit={handleCreateEpisode}
        onCancel={() => setShowEpisodeForm(false)}
        isPending={createEpisodeMutation.isPending}
      />

      {/* Edit Episode Dialog */}
      <EpisodeForm
        open={editingEpisode !== null}
        mode="edit"
        defaultValues={
          editingEpisode
            ? {
                number: editingEpisode.number,
                title: editingEpisode.title,
                description: editingEpisode.description,
                duration: editingEpisode.duration,
                videoUrl: editingEpisode.videoUrl,
                thumbnailUrl: editingEpisode.thumbnailUrl,
              }
            : undefined
        }
        onSubmit={handleUpdateEpisode}
        onCancel={() => setEditingEpisode(null)}
        isPending={updateEpisodeMutation.isPending}
      />

      {/* Delete Episode Confirmation */}
      <AlertDialog
        open={deletingEpisode !== null}
        onOpenChange={(open) => !open && setDeletingEpisode(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Episode</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Episode {deletingEpisode?.number}
              {deletingEpisode?.title
                ? ` "${deletingEpisode.title}"`
                : ""}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() =>
                deletingEpisode &&
                deleteEpisodeMutation.mutate(deletingEpisode.id)
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
