import { useState, useEffect } from "react";
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
  EpisodeForm,
  type EpisodeFormData,
} from "@/components/forms/EpisodeForm";
import { VideoUploader } from "@/components/content/VideoUploader";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { TranscodingBadge } from "@/components/content/TranscodingBadge";
import { getContent } from "@/api/content";
import type { ImagePaths } from "@/api/upload";
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

  // Thumbnail update mutation
  const thumbnailMutation = useMutation({
    mutationFn: ({
      episodeId,
      thumbnail,
    }: {
      episodeId: string;
      thumbnail: string | null;
    }) =>
      updateEpisode(seriesId, seasonId, episodeId, { thumbnail }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["episodes", seriesId, seasonId],
      });
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

  const handleThumbnailChange = (episodeId: string, paths: ImagePaths | null) => {
    thumbnailMutation.mutate({
      episodeId,
      thumbnail: paths?.medium ?? null,
    });
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
          <div className="space-y-4">
            {sortedEpisodes.map((episode) => (
              <EpisodeRow
                key={episode.id}
                episode={episode}
                seriesId={seriesId}
                onEdit={() => setEditingEpisode(episode)}
                onDelete={() => setDeletingEpisode(episode)}
                onThumbnailChange={(paths) =>
                  handleThumbnailChange(episode.id, paths)
                }
                onVideoUploadComplete={() => {
                  void queryClient.invalidateQueries({
                    queryKey: ["episodes", seriesId, seasonId],
                  });
                }}
              />
            ))}
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

interface EpisodeRowProps {
  episode: Episode;
  seriesId: string;
  onEdit: () => void;
  onDelete: () => void;
  onThumbnailChange: (paths: ImagePaths | null) => void;
  onVideoUploadComplete: () => void;
}

function EpisodeRow({
  episode,
  seriesId,
  onEdit,
  onDelete,
  onThumbnailChange,
  onVideoUploadComplete,
}: EpisodeRowProps) {
  // Local thumbnail state for immediate UI feedback after upload
  const [thumbnailPaths, setThumbnailPaths] = useState<ImagePaths | null>(
    episode.thumbnail
      ? ({ medium: episode.thumbnail } as ImagePaths)
      : null,
  );

  // Sync local state when server data changes (e.g. after query refetch)
  useEffect(() => {
    setThumbnailPaths(
      episode.thumbnail
        ? ({ medium: episode.thumbnail } as ImagePaths)
        : null,
    );
  }, [episode.thumbnail]);

  const handleThumbnailUpload = (paths: ImagePaths | null) => {
    // Update local state immediately so the image renders
    setThumbnailPaths(paths);
    // Persist to server + invalidate query
    onThumbnailChange(paths);
  };

  return (
    <div className="rounded-lg border border-border p-4">
      {/* Top row: metadata + actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              E{episode.number}
            </span>
            <h3 className="truncate font-medium">{episode.title}</h3>
            {episode.duration && (
              <span className="shrink-0 text-sm text-muted-foreground">
                {episode.duration} min
              </span>
            )}
          </div>
          {episode.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {episode.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom row: video uploader + thumbnail uploader */}
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <VideoUploader
          contentId={seriesId}
          episodeId={episode.id}
          currentKey={episode.sourceVideoKey}
          transcodingStatus={episode.transcodingStatus}
          transcodingError={episode.transcodingError}
          onUploadComplete={onVideoUploadComplete}
        />
        <ImageUploader
          type="thumbnail"
          value={thumbnailPaths}
          onChange={handleThumbnailUpload}
          label="Episode Thumbnail"
        />
      </div>
    </div>
  );
}
