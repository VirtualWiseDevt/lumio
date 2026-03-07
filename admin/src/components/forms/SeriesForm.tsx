import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { createContent, updateContent } from "@/api/content";
import type { Content } from "@/api/content";
import { listCategories } from "@/api/categories";
import type { ImagePaths } from "@/api/upload";

const AGE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17", "TV-MA", "TV-14", "TV-PG", "TV-Y"];
const QUALITY_OPTIONS = ["SD", "HD", "FHD", "4K"];

const seriesSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  releaseYear: z.string().optional(),
  ageRating: z.string().optional(),
  quality: z.string().optional(),
  categories: z.array(z.string()),
  cast: z.string().optional(),
  director: z.string().optional(),
  trailerUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  isPublished: z.boolean(),
});

type SeriesFormValues = z.infer<typeof seriesSchema>;

interface SeriesFormProps {
  mode: "create" | "edit";
  defaultValues?: Content;
  onSuccess?: (content: Content) => void;
}

export function SeriesForm({ mode, defaultValues, onSuccess }: SeriesFormProps) {
  const queryClient = useQueryClient();

  const [posterPaths, setPosterPaths] = useState<ImagePaths | null>(
    defaultValues?.posterPortrait
      ? ({ medium: defaultValues.posterPortrait } as ImagePaths)
      : null,
  );
  const [backdropPaths, setBackdropPaths] = useState<ImagePaths | null>(
    defaultValues?.posterLandscape
      ? ({ medium: defaultValues.posterLandscape } as ImagePaths)
      : null,
  );

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SeriesFormValues>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      releaseYear: defaultValues?.releaseYear?.toString() ?? "",
      ageRating: defaultValues?.ageRating ?? "",
      quality: defaultValues?.quality ?? "",
      categories: defaultValues?.categories ?? [],
      cast: defaultValues?.cast?.join(", ") ?? "",
      director: defaultValues?.director ?? "",
      trailerUrl: defaultValues?.trailerUrl ?? "",
      isPublished: defaultValues?.isPublished ?? false,
    },
  });

  const selectedCategories = watch("categories");
  const isPublished = watch("isPublished");

  // Reset form when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues && mode === "edit") {
      reset({
        title: defaultValues.title ?? "",
        description: defaultValues.description ?? "",
        releaseYear: defaultValues.releaseYear?.toString() ?? "",
        ageRating: defaultValues.ageRating ?? "",
        quality: defaultValues.quality ?? "",
        categories: defaultValues.categories ?? [],
        cast: defaultValues.cast?.join(", ") ?? "",
        director: defaultValues.director ?? "",
        trailerUrl: defaultValues.trailerUrl ?? "",
        isPublished: defaultValues.isPublished ?? false,
      });
    }
  }, [defaultValues, mode, reset]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Content>) => createContent(data),
    onSuccess: (result) => {
      toast.success("Series created successfully");
      void queryClient.invalidateQueries({ queryKey: ["content"] });
      onSuccess?.(result);
    },
    onError: () => {
      toast.error("Failed to create series");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Content>) =>
      updateContent(defaultValues!.id, data),
    onSuccess: (result) => {
      toast.success("Series updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["content"] });
      onSuccess?.(result);
    },
    onError: () => {
      toast.error("Failed to update series");
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: SeriesFormValues) => {
    const castArray = values.cast
      ? values.cast
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const payload: Partial<Content> = {
      type: "SERIES",
      title: values.title,
      description: values.description || null,
      releaseYear: values.releaseYear ? parseInt(values.releaseYear, 10) : null,
      ageRating: values.ageRating || null,
      quality: values.quality || null,
      categories: values.categories,
      cast: castArray,
      director: values.director || null,
      trailerUrl: values.trailerUrl || null,
      posterPortrait: posterPaths?.medium ?? null,
      posterLandscape: backdropPaths?.medium ?? null,
      isPublished: values.isPublished,
    };

    if (mode === "create") {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  const toggleCategory = (slug: string) => {
    const current = selectedCategories ?? [];
    if (current.includes(slug)) {
      setValue(
        "categories",
        current.filter((c) => c !== slug),
      );
    } else {
      setValue("categories", [...current, slug]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" {...register("title")} placeholder="Series title" />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Series description"
          rows={4}
        />
      </div>

      {/* Row: Year, Age Rating, Quality */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="releaseYear">Release Year</Label>
          <Input
            id="releaseYear"
            type="number"
            {...register("releaseYear")}
            placeholder="2024"
          />
          {errors.releaseYear && (
            <p className="text-sm text-destructive">
              {errors.releaseYear.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Age Rating</Label>
          <Select
            value={watch("ageRating") ?? ""}
            onValueChange={(val) => setValue("ageRating", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {AGE_RATINGS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quality</Label>
          <Select
            value={watch("quality") ?? ""}
            onValueChange={(val) => setValue("quality", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select quality" />
            </SelectTrigger>
            <SelectContent>
              {QUALITY_OPTIONS.map((q) => (
                <SelectItem key={q} value={q}>
                  {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <Label>Categories</Label>
        <div className="flex flex-wrap gap-2">
          {categories?.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.slug)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                selectedCategories?.includes(cat.slug)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50"
              }`}
            >
              {cat.name}
            </button>
          ))}
          {categories?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No categories yet. Create some in Settings.
            </p>
          )}
        </div>
      </div>

      {/* Cast and Director */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cast">Cast (comma-separated)</Label>
          <Input
            id="cast"
            {...register("cast")}
            placeholder="Actor 1, Actor 2"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="director">Director</Label>
          <Input
            id="director"
            {...register("director")}
            placeholder="Director name"
          />
        </div>
      </div>

      {/* Trailer URL */}
      <div className="space-y-2">
        <Label htmlFor="trailerUrl">Trailer URL</Label>
        <Input
          id="trailerUrl"
          {...register("trailerUrl")}
          placeholder="https://youtube.com/..."
        />
        {errors.trailerUrl && (
          <p className="text-sm text-destructive">
            {errors.trailerUrl.message}
          </p>
        )}
      </div>

      {/* Images */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
      </div>

      {/* Published toggle */}
      <div className="flex items-center gap-3">
        <Switch
          id="isPublished"
          checked={isPublished}
          onCheckedChange={(checked) => setValue("isPublished", checked)}
        />
        <Label htmlFor="isPublished">Published</Label>
      </div>

      {/* Submit */}
      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "create" ? "Create Series" : "Save Changes"}
      </Button>
    </form>
  );
}
