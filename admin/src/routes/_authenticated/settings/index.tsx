import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "@/routes/_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";

export const settingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/settings",
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PageContainer title="Settings">
      <div className="space-y-6">
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </PageContainer>
  );
}
