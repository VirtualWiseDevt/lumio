import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "../_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";

export const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/",
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <PageContainer title="Dashboard">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Welcome to the Lumio admin panel. Use the sidebar to manage your
          content.
        </p>
      </div>
    </PageContainer>
  );
}
