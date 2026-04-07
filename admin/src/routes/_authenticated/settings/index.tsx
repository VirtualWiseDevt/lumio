import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "@/routes/_authenticated";
import { PageContainer } from "@/components/layout/PageContainer";
import { Separator } from "@/components/ui/separator";
import { MpesaSettings } from "@/components/settings/MpesaSettings";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { PricingSettings } from "@/components/settings/PricingSettings";
import { LimitSettings } from "@/components/settings/LimitSettings";

export const settingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/settings",
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PageContainer title="Settings">
      <div className="space-y-6">
        <MpesaSettings />
        <Separator />
        <GeneralSettings />
        <Separator />
        <PricingSettings />
        <Separator />
        <LimitSettings />
      </div>
    </PageContainer>
  );
}
