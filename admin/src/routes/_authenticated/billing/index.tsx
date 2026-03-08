import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "@/routes/_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";

export const billingRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/billing",
  component: BillingPage,
});

function BillingPage() {
  return (
    <PageContainer title="Billing">
      <div className="space-y-6">
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </PageContainer>
  );
}
