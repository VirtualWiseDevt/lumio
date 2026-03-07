import { createRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { authenticatedRoute } from "../../_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MovieForm } from "@/components/forms/MovieForm";
import { getContent } from "@/api/content";

export const movieEditRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/movies/$movieId",
  component: MovieEditPage,
});

function MovieEditPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { movieId?: string };
  const movieId = params.movieId ?? "";

  const { data: content, isLoading, error } = useQuery({
    queryKey: ["content", movieId],
    queryFn: () => getContent(movieId),
    enabled: !!movieId,
  });

  if (isLoading) {
    return (
      <PageContainer title="Edit Movie">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="aspect-[2/3] w-full max-w-[200px]" />
              <Skeleton className="aspect-[16/9] w-full max-w-[200px]" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !content) {
    return (
      <PageContainer title="Edit Movie">
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void navigate({ to: "/movies" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Movies
          </Button>
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">
              Movie not found or failed to load.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Edit Movie">
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void navigate({ to: "/movies" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Movies
        </Button>

        <MovieForm
          mode="edit"
          defaultValues={content}
          contentType="MOVIE"
          onSuccess={() => void navigate({ to: "/movies" })}
        />
      </div>
    </PageContainer>
  );
}
