"use client";

import Link from "next/link";
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

          {/* Invite Friends */}
          <Link
            href="/invite"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-white">Invite Friends</p>
              <p className="text-sm text-white/50">
                Earn free streaming by referring friends
              </p>
            </div>
            <svg
              className="ml-auto h-5 w-5 text-white/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
