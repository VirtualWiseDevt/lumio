"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserSessions, deleteSession } from "@/api/user";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import type { DeviceSession } from "@/types/player";

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function DeviceIcon({ type }: { type: string }) {
  const className = "h-5 w-5 text-gray-400";
  switch (type.toLowerCase()) {
    case "mobile":
      return <Smartphone className={className} />;
    case "tablet":
      return <Tablet className={className} />;
    default:
      return <Monitor className={className} />;
  }
}

function DeviceRow({ session }: { session: DeviceSession }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const removeMutation = useMutation({
    mutationFn: () => deleteSession(session.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSessions"] });
      setConfirming(false);
    },
  });

  return (
    <div className="flex items-center gap-4 rounded-lg bg-white/5 px-4 py-3">
      <DeviceIcon type={session.deviceType} />

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">
            {session.deviceName}
          </span>
          {session.isCurrent && (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
              This device
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{session.ipAddress}</span>
          <span>--</span>
          <span>{timeAgo(session.lastActiveAt)}</span>
        </div>
      </div>

      {!session.isCurrent && (
        <>
          {confirming ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => removeMutation.mutate()}
                disabled={removeMutation.isPending}
                className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {removeMutation.isPending ? "Removing..." : "Confirm"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-sm text-red-500 hover:text-red-400"
            >
              Remove
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function DeviceSection() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["userSessions"],
    queryFn: getUserSessions,
  });

  return (
    <section className="rounded-lg border border-white/10 bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Devices</h2>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-14 rounded-lg bg-white/10" />
          <div className="h-14 rounded-lg bg-white/10" />
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <p className="text-sm text-gray-400">No active sessions</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <DeviceRow key={session.id} session={session} />
          ))}
        </div>
      )}
    </section>
  );
}
