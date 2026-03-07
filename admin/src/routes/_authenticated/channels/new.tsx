import { createRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { authenticatedRoute } from "../../_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ChannelForm } from "@/components/forms/ChannelForm";

export const channelNewRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/channels/new",
  component: ChannelNewPage,
});

function ChannelNewPage() {
  const navigate = useNavigate();

  return (
    <PageContainer title="Add TV Channel">
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void navigate({ to: "/channels" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Channels
        </Button>

        <ChannelForm
          mode="create"
          onSuccess={() => void navigate({ to: "/channels" })}
        />
      </div>
    </PageContainer>
  );
}
