import { createRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { authenticatedRoute } from "../../_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelForm } from "@/components/forms/ChannelForm";
import { getContent } from "@/api/content";

export const channelEditRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/channels/$channelId",
  component: ChannelEditPage,
});

function ChannelEditPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { channelId?: string };
  const channelId = params.channelId ?? "";

  const { data: content, isLoading, error } = useQuery({
    queryKey: ["content", channelId],
    queryFn: () => getContent(channelId),
    enabled: !!channelId,
  });

  if (isLoading) {
    return (
      <PageContainer title="Edit Channel">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
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
      <PageContainer title="Edit Channel">
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void navigate({ to: "/channels" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Channels
          </Button>
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">
              Channel not found or failed to load.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Edit Channel">
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
          mode="edit"
          defaultValues={content}
          onSuccess={() => void navigate({ to: "/channels" })}
        />
      </div>
    </PageContainer>
  );
}
