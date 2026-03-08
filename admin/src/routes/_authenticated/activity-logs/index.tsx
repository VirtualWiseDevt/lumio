import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "@/routes/_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";

export const activityLogsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/activity-logs",
  component: ActivityLogsPage,
});

function ActivityLogsPage() {
  return (
    <PageContainer title="Activity Logs">
      <div className="space-y-6">
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </PageContainer>
  );
}
