import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { listCategories } from "@/api/categories";
import { createContent, updateContent } from "@/api/content";
import type { Content } from "@/api/content";
import type { ImagePaths } from "@/api/upload";

const channelFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  streamUrl: z.string().min(1, "Stream URL is required"),
});

type ChannelFormValues = z.input<typeof channelFormSchema>;

interface ChannelFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<Content>;
  onSuccess: () => void;
}

export function ChannelForm({
  mode,
  defaultValues,
  onSuccess,
}: ChannelFormProps) {
  const [categories, setCategories] = useState<string[]>(
    defaultValues?.categories ?? [],
  );
  const [posterPaths, setPosterPaths] = useState<ImagePaths | null>(
    defaultValues?.posterPortrait
      ? ({
          original: defaultValues.posterPortrait,
          large: defaultValues.posterPortrait,
          medium: defaultValues.posterPortrait,
          thumbnail: defaultValues.posterPortrait,
        } as ImagePaths)
      : null,
  );
  const [backdropPaths, setBackdropPaths] = useState<ImagePaths | null>(
    defaultValues?.posterLandscape
      ? ({
          original: defaultValues.posterLandscape,
          large: defaultValues.posterLandscape,
          medium: defaultValues.posterLandscape,
        } as ImagePaths)
      : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublished, setIsPublished] = useState(
    defaultValues?.isPublished ?? false,
  );

  const { data: categoryList } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      streamUrl: defaultValues?.streamUrl ?? "",
    },
  });

  useEffect(() => {
    if (defaultValues && mode === "edit") {
      setCategories(defaultValues.categories ?? []);
      setIsPublished(defaultValues.isPublished ?? false);
      if (defaultValues.posterPortrait) {
        setPosterPaths({
          original: defaultValues.posterPortrait,
          large: defaultValues.posterPortrait,
          medium: defaultValues.posterPortrait,
          thumbnail: defaultValues.posterPortrait,
        });
      }
      if (defaultValues.posterLandscape) {
        setBackdropPaths({
          original: defaultValues.posterLandscape,
          large: defaultValues.posterLandscape,
          medium: defaultValues.posterLandscape,
        });
      }
    }
  }, [defaultValues, mode]);

  const toggleCategory = (slug: string) => {
    setCategories((prev) =>
      prev.includes(slug)
        ? prev.filter((c) => c !== slug)
        : [...prev, slug],
    );
  };

  const onSubmit = async (data: ChannelFormValues, publish: boolean) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        type: "CHANNEL" as const,
        categories,
        posterPortrait: posterPaths?.original ?? undefined,
        posterLandscape: backdropPaths?.original ?? undefined,
        isPublished: publish,
        description: data.description || undefined,
      };

      if (mode === "edit" && defaultValues?.id) {
        await updateContent(defaultValues.id, payload);
        toast.success("Channel updated successfully");
      } else {
        await createContent(payload);
        toast.success("Channel created successfully");
      }
      onSuccess();
    } catch {
      toast.error(mode === "edit" ? "Failed to update" : "Failed to create");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data, isPublished))}
      className="space-y-8"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Left column: Main fields */}
        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter channel name"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter channel description"
              rows={4}
              {...register("description")}
            />
          </div>

          {/* Stream URL */}
          <div className="space-y-2">
            <Label htmlFor="streamUrl">Stream URL *</Label>
            <Input
              id="streamUrl"
              placeholder="https://stream.example.com/live/channel"
              {...register("streamUrl")}
              aria-invalid={!!errors.streamUrl}
            />
            {errors.streamUrl && (
              <p className="text-sm text-destructive">
                {errors.streamUrl.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              HLS or DASH stream URL for the live channel.
            </p>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2 rounded-md border border-input p-3">
              {categoryList && categoryList.length > 0 ? (
                categoryList.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.slug)}
                    className={`rounded-md px-3 py-1 text-sm transition-colors ${
                      categories.includes(cat.slug)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No categories available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Images + Publish */}
        <div className="space-y-6">
          <ImageUploader
            type="poster"
            value={posterPaths}
            onChange={setPosterPaths}
            label="Poster Image"
          />

          <ImageUploader
            type="backdrop"
            value={backdropPaths}
            onChange={setBackdropPaths}
            label="Backdrop Image"
          />

          {/* Published toggle */}
          <div className="flex items-center gap-3 rounded-md border border-input p-4">
            <Switch
              id="isPublished"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="isPublished" className="cursor-pointer">
              {isPublished ? "Published" : "Draft"}
            </Label>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={handleSubmit((data) => onSubmit(data, false))}
        >
          {isSubmitting ? "Saving..." : "Save as Draft"}
        </Button>
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit((data) => onSubmit(data, true))}
        >
          {isSubmitting ? "Saving..." : "Save & Publish"}
        </Button>
      </div>
    </form>
  );
}
