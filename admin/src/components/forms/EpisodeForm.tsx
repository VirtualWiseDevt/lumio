import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
});

type EpisodeFormValues = z.infer<typeof episodeSchema>;

export interface EpisodeFormData {
  number: number;
  title: string;
  description?: string;
  duration?: number;
}

interface EpisodeFormProps {
  open: boolean;
  mode: "create" | "edit";
  defaultValues?: {
    number?: number;
    title?: string;
    description?: string | null;
    duration?: number | null;
  };
  onSubmit: (data: EpisodeFormData) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function EpisodeForm({
  open,
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
}: EpisodeFormProps) {
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
      });
    }
  }, [open, defaultValues, reset]);

  const handleFormSubmit = (values: EpisodeFormValues) => {
    onSubmit({
      number: parseInt(values.number, 10),
      title: values.title,
      description: values.description || undefined,
      duration: values.duration ? parseInt(values.duration, 10) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Episode" : "Edit Episode"}
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
