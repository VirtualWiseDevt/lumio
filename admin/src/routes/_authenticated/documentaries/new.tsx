import { createRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { authenticatedRoute } from "../../_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { MovieForm } from "@/components/forms/MovieForm";

export const documentaryNewRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/documentaries/new",
  component: DocumentaryNewPage,
});

function DocumentaryNewPage() {
  const navigate = useNavigate();

  return (
    <PageContainer title="Add Documentary">
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void navigate({ to: "/documentaries" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documentaries
        </Button>

        <MovieForm
          mode="create"
          contentType="DOCUMENTARY"
          onSuccess={() => void navigate({ to: "/documentaries" })}
        />
      </div>
    </PageContainer>
  );
}
