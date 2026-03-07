"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, updateUserProfile } from "@/api/user";

function InlineEdit({
  label,
  value,
  field,
}: {
  label: string;
  value: string;
  field: "name" | "phone";
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const mutation = useMutation({
    mutationFn: (newValue: string) =>
      updateUserProfile({ [field]: newValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setEditing(false);
    },
  });

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-400">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="rounded bg-white/10 px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-red-500"
            autoFocus
          />
          <button
            onClick={() => mutation.mutate(draft)}
            disabled={mutation.isPending || draft === value}
            className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="rounded px-3 py-1.5 text-sm text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
        {mutation.isError && (
          <p className="text-xs text-red-400">Failed to update. Try again.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-white">{value}</span>
        <button
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="text-sm text-red-500 hover:text-red-400"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export function ProfileSection() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
  });

  if (isLoading || !profile) {
    return (
      <section className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Profile</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-20 w-20 rounded-full bg-white/10" />
          <div className="h-4 w-48 rounded bg-white/10" />
          <div className="h-4 w-36 rounded bg-white/10" />
        </div>
      </section>
    );
  }

  const initials = profile.name
    ? profile.name.charAt(0).toUpperCase()
    : profile.email.charAt(0).toUpperCase();

  return (
    <section className="rounded-lg border border-white/10 bg-white/5 p-6">
      <h2 className="mb-6 text-lg font-semibold text-white">Profile</h2>

      <div className="flex items-start gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-red-600 text-2xl font-bold text-white">
          {initials}
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Email</label>
            <span className="text-sm text-white">{profile.email}</span>
            <span className="text-xs text-gray-500">
              Email cannot be changed
            </span>
          </div>

          <InlineEdit label="Name" value={profile.name} field="name" />
          <InlineEdit label="Phone" value={profile.phone} field="phone" />
        </div>
      </div>
    </section>
  );
}
