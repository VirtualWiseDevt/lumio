import { createRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { authenticatedRoute } from "../../_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { MovieForm } from "@/components/forms/MovieForm";

export const movieNewRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/movies/new",
  component: MovieNewPage,
});

function MovieNewPage() {
  const navigate = useNavigate();

  return (
    <PageContainer title="Add Movie">
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
          mode="create"
          contentType="MOVIE"
          onSuccess={() => void navigate({ to: "/movies" })}
        />
      </div>
    </PageContainer>
  );
}
