"use client";

import { ProfileSection } from "@/components/account/ProfileSection";
import { SubscriptionSection } from "@/components/account/SubscriptionSection";
import { DeviceSection } from "@/components/account/DeviceSection";
import { PreferencesSection } from "@/components/account/PreferencesSection";

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-white">
          Account Settings
        </h1>

        <div className="flex flex-col gap-8">
          <ProfileSection />
          <SubscriptionSection />
          <DeviceSection />
          <PreferencesSection />
        </div>
      </div>
    </main>
  );
}
