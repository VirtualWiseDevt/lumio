import { createRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { authenticatedRoute } from "../../_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { SeriesForm } from "@/components/forms/SeriesForm";
import type { Content } from "@/api/content";

export const seriesNewRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/series/new",
  component: SeriesNewPage,
});

function SeriesNewPage() {
  const navigate = useNavigate();

  const handleSuccess = (content: Content) => {
    void navigate({ to: `/series/${content.id}` as string });
  };

  return (
    <PageContainer title="Add Series">
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void navigate({ to: "/series" as string })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Series
        </Button>

        <SeriesForm mode="create" onSuccess={handleSuccess} />
      </div>
    </PageContainer>
  );
}
