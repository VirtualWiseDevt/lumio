import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VideoUploader } from "@/components/content/VideoUploader";
import { TranscodingBadge } from "@/components/content/TranscodingBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const episodeSchema = z.object({
  number: z.string().min(1, "Episode number is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  duration: z.string().optional(),
  videoUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  thumbnailUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
});

type EpisodeFormValues = z.infer<typeof episodeSchema>;

export interface EpisodeFormData {
  number: number;
  title: string;
  description?: string;
  duration?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface EpisodeFormProps {
  open: boolean;
  mode: "create" | "edit";
  contentId?: string;
  episodeId?: string;
  defaultValues?: {
    number?: number;
    title?: string;
    description?: string | null;
    duration?: number | null;
    videoUrl?: string | null;
    thumbnailUrl?: string | null;
    sourceVideoKey?: string | null;
    transcodingStatus?: string | null;
    transcodingError?: string | null;
  };
  onSubmit: (data: EpisodeFormData) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function EpisodeForm({
  open,
  mode,
  contentId,
  episodeId,
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
}: EpisodeFormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EpisodeFormValues>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      number: defaultValues?.number?.toString() ?? "",
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      duration: defaultValues?.duration?.toString() ?? "",
      videoUrl: defaultValues?.videoUrl ?? "",
      thumbnailUrl: defaultValues?.thumbnailUrl ?? "",
    },
  });

  // Reset form when dialog opens or defaultValues change
  useEffect(() => {
    if (open) {
      reset({
        number: defaultValues?.number?.toString() ?? "",
        title: defaultValues?.title ?? "",
        description: defaultValues?.description ?? "",
        duration: defaultValues?.duration?.toString() ?? "",
        videoUrl: defaultValues?.videoUrl ?? "",
        thumbnailUrl: defaultValues?.thumbnailUrl ?? "",
      });
    }
  }, [open, defaultValues, reset]);

  const handleFormSubmit = (values: EpisodeFormValues) => {
    onSubmit({
      number: parseInt(values.number, 10),
      title: values.title,
      description: values.description || undefined,
      duration: values.duration ? parseInt(values.duration, 10) : undefined,
      videoUrl: values.videoUrl || undefined,
      thumbnailUrl: values.thumbnailUrl || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? "Add Episode" : "Edit Episode"}
            {mode === "edit" && defaultValues?.transcodingStatus && (
              <TranscodingBadge
                status={defaultValues.transcodingStatus}
                error={defaultValues.transcodingError}
              />
            )}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Episode Number */}
            <div className="space-y-2">
              <Label htmlFor="ep-number">Episode Number *</Label>
              <Input
                id="ep-number"
                type="number"
                {...register("number")}
                placeholder="1"
              />
              {errors.number && (
                <p className="text-sm text-destructive">
                  {errors.number.message}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="ep-duration">Duration (min)</Label>
              <Input
                id="ep-duration"
                type="number"
                {...register("duration")}
                placeholder="45"
              />
              {errors.duration && (
                <p className="text-sm text-destructive">
                  {errors.duration.message}
                </p>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="ep-title">Title *</Label>
            <Input
              id="ep-title"
              {...register("title")}
              placeholder="Episode title"
            />
            {errors.title && (
              <p className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="ep-description">Description</Label>
            <Textarea
              id="ep-description"
              {...register("description")}
              placeholder="Episode description"
              rows={3}
            />
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <Label htmlFor="ep-videoUrl">Video URL</Label>
            <Input
              id="ep-videoUrl"
              {...register("videoUrl")}
              placeholder="https://..."
            />
            {errors.videoUrl && (
              <p className="text-sm text-destructive">
                {errors.videoUrl.message}
              </p>
            )}
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-2">
            <Label htmlFor="ep-thumbnailUrl">Thumbnail URL</Label>
            <Input
              id="ep-thumbnailUrl"
              {...register("thumbnailUrl")}
              placeholder="https://..."
            />
            {errors.thumbnailUrl && (
              <p className="text-sm text-destructive">
                {errors.thumbnailUrl.message}
              </p>
            )}
          </div>

          {/* Video Upload (edit mode only) */}
          {mode === "edit" && contentId && episodeId && (
            <VideoUploader
              contentId={contentId}
              episodeId={episodeId}
              currentKey={defaultValues?.sourceVideoKey}
              transcodingStatus={defaultValues?.transcodingStatus}
              transcodingError={defaultValues?.transcodingError}
              onUploadComplete={() => {
                void queryClient.invalidateQueries({
                  queryKey: ["episodes"],
                });
              }}
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === "create" ? "Add Episode" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
