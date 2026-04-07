"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyReferralCode, getReferralStats } from "@/api/referral";

export default function InvitePage() {
  const [copied, setCopied] = useState(false);

  const { data: referralData, isLoading: codeLoading } = useQuery({
    queryKey: ["referral-code"],
    queryFn: getMyReferralCode,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["referral-stats"],
    queryFn: getReferralStats,
  });

  const referralUrl = referralData?.referralUrl ?? "";

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Join me on Lumio! Stream unlimited movies, series & Live TV. Use my invite link: ${referralUrl}`
  );
  const smsMessage = encodeURIComponent(
    `Join me on Lumio! ${referralUrl}`
  );

  return (
    <main className="min-h-screen bg-background pb-16" style={{ paddingTop: 96 }}>
      <div className="mx-auto max-w-2xl px-4">
        {/* Hero Section */}
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl text-white md:text-4xl">
            Invite Friends, Earn Free Streaming
          </h1>
          <p className="mt-3 text-lg text-white/60">
            For every friend who joins and subscribes, you earn 10% off your
            next payment. Refer 10 friends and stream for free!
          </p>
        </div>

        {/* Referral Link Box */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-white/60">
            Your Referral Link
          </label>
          {codeLoading ? (
            <div className="h-12 animate-pulse rounded-lg bg-white/5" />
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <span className="min-w-0 flex-1 truncate text-sm text-white/80">
                {referralUrl}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                {copied ? (
                  <span className="flex items-center gap-1">
                    <svg
                      className="h-4 w-4 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  "Copy"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Share Buttons */}
        <div className="mb-10 flex gap-3">
          <a
            href={`https://wa.me/?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share via WhatsApp
          </a>
          <a
            href={`sms:?body=${smsMessage}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Share via SMS
          </a>
        </div>

        {/* Referral Stats */}
        <div className="mb-10 grid grid-cols-2 gap-4">
          {statsLoading ? (
            <>
              <div className="h-24 animate-pulse rounded-xl bg-white/5" />
              <div className="h-24 animate-pulse rounded-xl bg-white/5" />
            </>
          ) : (
            <>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                <p className="text-3xl font-bold text-white">
                  {stats?.friendsJoined ?? 0}
                </p>
                <p className="mt-1 text-sm text-white/60">Friends Joined</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                <p className="text-3xl font-bold text-white">
                  KES {(stats?.creditsEarned ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-white/60">Credits Earned</p>
              </div>
            </>
          )}
        </div>

        {/* Community Guidelines */}
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-yellow-500">
                Community Guidelines
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                We kindly remind you that sharing this link on social media
                platforms including Reddit, Discord, Telegram, Facebook, and
                Instagram is strictly prohibited. Violations result in:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-white/70">
                <li>Immediate suspension of your account</li>
                <li>Suspension of your referrer&apos;s account</li>
                <li>Suspension of accounts you referred</li>
              </ul>
              <p className="mt-2 text-sm text-white/70">
                Lumio is a privacy-centric service curated for friends and
                family exclusively.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
