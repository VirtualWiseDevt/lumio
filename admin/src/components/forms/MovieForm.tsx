import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
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
import { VideoUploader } from "@/components/content/VideoUploader";
import { TranscodingBadge } from "@/components/content/TranscodingBadge";
import { listCategories } from "@/api/categories";
import { createContent, updateContent } from "@/api/content";
import type { Content } from "@/api/content";
import type { ImagePaths } from "@/api/upload";

const movieFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  releaseYear: z.string().optional(),
  duration: z.string().optional(),
  ageRating: z.string().optional(),
  quality: z.string().optional(),
  director: z.string().optional(),
  trailerUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  videoUrl: z.string().optional(),
});

type MovieFormValues = z.infer<typeof movieFormSchema>;

interface MovieFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<Content>;
  contentType: "MOVIE" | "DOCUMENTARY";
  onSuccess: () => void;
}

const AGE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17"];
const QUALITY_OPTIONS = ["SD", "HD", "FHD", "4K"];

export function MovieForm({
  mode,
  defaultValues,
  contentType,
  onSuccess,
}: MovieFormProps) {
  const queryClient = useQueryClient();

  const [categories, setCategories] = useState<string[]>(
    defaultValues?.categories ?? [],
  );
  const [cast, setCast] = useState<string[]>(defaultValues?.cast ?? []);
  const [castInput, setCastInput] = useState("");
  const [posterPaths, setPosterPaths] = useState<ImagePaths | null>(
    defaultValues?.posterPortrait
      ? ({ original: defaultValues.posterPortrait, large: "", medium: "", thumbnail: "" } as ImagePaths)
      : null,
  );
  const [backdropPaths, setBackdropPaths] = useState<ImagePaths | null>(
    defaultValues?.posterLandscape
      ? ({ original: defaultValues.posterLandscape, large: "", medium: "" } as ImagePaths)
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
    setValue,
  } = useForm<MovieFormValues>({
    resolver: zodResolver(movieFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      releaseYear: defaultValues?.releaseYear?.toString() ?? "",
      duration: defaultValues?.duration?.toString() ?? "",
      ageRating: defaultValues?.ageRating ?? "",
      quality: defaultValues?.quality ?? "",
      director: defaultValues?.director ?? "",
      trailerUrl: defaultValues?.trailerUrl ?? "",
      videoUrl: defaultValues?.videoUrl ?? "",
    },
  });

  // Sync defaultValues for edit mode when data loads
  useEffect(() => {
    if (defaultValues && mode === "edit") {
      setCategories(defaultValues.categories ?? []);
      setCast(defaultValues.cast ?? []);
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

  const handleCastKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = castInput.trim();
      if (trimmed && !cast.includes(trimmed)) {
        setCast((prev) => [...prev, trimmed]);
      }
      setCastInput("");
    }
  };

  const removeCastMember = (name: string) => {
    setCast((prev) => prev.filter((c) => c !== name));
  };

  const toggleCategory = (slug: string) => {
    setCategories((prev) =>
      prev.includes(slug)
        ? prev.filter((c) => c !== slug)
        : [...prev, slug],
    );
  };

  const onSubmit = async (data: MovieFormValues, publish: boolean) => {
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type: contentType,
        title: data.title,
        categories,
        cast,
        posterPortrait: posterPaths?.original ?? undefined,
        posterLandscape: backdropPaths?.original ?? undefined,
        isPublished: publish,
        // Convert strings to numbers, empty strings to undefined
        releaseYear: data.releaseYear ? Number(data.releaseYear) : undefined,
        duration: data.duration ? Number(data.duration) : undefined,
        description: data.description || undefined,
        ageRating: data.ageRating || undefined,
        quality: data.quality || undefined,
        director: data.director || undefined,
        trailerUrl: data.trailerUrl || undefined,
        videoUrl: data.videoUrl || undefined,
      };

      if (mode === "edit" && defaultValues?.id) {
        await updateContent(defaultValues.id, payload);
        toast.success(
          contentType === "MOVIE"
            ? "Movie updated successfully"
            : "Documentary updated successfully",
        );
      } else {
        await createContent(payload);
        toast.success(
          contentType === "MOVIE"
            ? "Movie created successfully"
            : "Documentary created successfully",
        );
      }
      onSuccess();
    } catch {
      toast.error(
        mode === "edit" ? "Failed to update" : "Failed to create",
      );
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
            <div className="flex items-center gap-2">
              <Label htmlFor="title">Title *</Label>
              {mode === "edit" && defaultValues?.transcodingStatus && (
                <TranscodingBadge
                  status={defaultValues.transcodingStatus}
                  error={defaultValues.transcodingError}
                />
              )}
            </div>
            <Input
              id="title"
              placeholder="Enter title"
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
              placeholder="Enter description"
              rows={4}
              {...register("description")}
            />
          </div>

          {/* Release Year + Duration row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="releaseYear">Release Year</Label>
              <Input
                id="releaseYear"
                type="number"
                placeholder="2024"
                min={1900}
                max={2100}
                {...register("releaseYear")}
                aria-invalid={!!errors.releaseYear}
              />
              {errors.releaseYear && (
                <p className="text-sm text-destructive">
                  {errors.releaseYear.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="120"
                min={1}
                {...register("duration")}
                aria-invalid={!!errors.duration}
              />
              {errors.duration && (
                <p className="text-sm text-destructive">
                  {errors.duration.message}
                </p>
              )}
            </div>
          </div>

          {/* Age Rating + Quality row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Age Rating</Label>
              <Select
                value={errors.ageRating ? "" : undefined}
                defaultValue={defaultValues?.ageRating ?? ""}
                onValueChange={(v) => setValue("ageRating", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_RATINGS.map((rating) => (
                    <SelectItem key={rating} value={rating}>
                      {rating}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quality</Label>
              <Select
                defaultValue={defaultValues?.quality ?? ""}
                onValueChange={(v) => setValue("quality", v)}
              >
                <SelectTrigger className="w-full">
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

          {/* Director */}
          <div className="space-y-2">
            <Label htmlFor="director">Director</Label>
            <Input
              id="director"
              placeholder="Enter director name"
              {...register("director")}
            />
          </div>

          {/* Cast */}
          <div className="space-y-2">
            <Label htmlFor="cast">Cast</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {cast.map((member) => (
                <span
                  key={member}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
                >
                  {member}
                  <button
                    type="button"
                    onClick={() => removeCastMember(member)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <Input
              id="cast"
              placeholder="Type name and press Enter"
              value={castInput}
              onChange={(e) => setCastInput(e.target.value)}
              onKeyDown={handleCastKeyDown}
            />
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

          {/* Trailer URL */}
          <div className="space-y-2">
            <Label htmlFor="trailerUrl">Trailer URL</Label>
            <Input
              id="trailerUrl"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              {...register("trailerUrl")}
              aria-invalid={!!errors.trailerUrl}
            />
            {errors.trailerUrl && (
              <p className="text-sm text-destructive">
                {errors.trailerUrl.message}
              </p>
            )}
          </div>

          {/* Video Upload */}
          {mode === "edit" && defaultValues?.id ? (
            <VideoUploader
              contentId={defaultValues.id}
              currentKey={defaultValues.sourceVideoKey}
              transcodingStatus={defaultValues.transcodingStatus}
              transcodingError={defaultValues.transcodingError}
              onUploadComplete={() => {
                void queryClient.invalidateQueries({
                  queryKey: ["content", defaultValues.id],
                });
              }}
            />
          ) : (
            <div className="space-y-2">
              <Label>Video File</Label>
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-4">
                Save content first, then upload video on the edit page.
              </p>
            </div>
          )}
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
