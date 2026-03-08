"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, forceLogin } from "@/api/auth";
import type { DeviceLimitResponse } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deviceLimit, setDeviceLimit] = useState<DeviceLimitResponse | null>(
    null
  );
  const [replacingSession, setReplacingSession] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDeviceLimit(null);
    setSubmitting(true);

    try {
      const result = await login({
        email: email.trim(),
        password,
      });

      if ("deviceLimitReached" in result) {
        setDeviceLimit(result);
      } else {
        router.push("/");
      }
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForceLogin(sessionId: string) {
    setError("");
    setReplacingSession(sessionId);

    try {
      await forceLogin({
        email: email.trim(),
        password,
        sessionId,
      });
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setReplacingSession(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold tracking-tight">
            <span className="text-accent">L</span>umio
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Sign in to your account
          </h1>
        </div>

        {!deviceLimit ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Your password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-300">
              You have reached the maximum number of devices.
            </div>

            <p className="text-sm text-muted">
              Choose a device to replace with this one:
            </p>

            <ul className="space-y-2">
              {deviceLimit.devices.map((device) => (
                <li
                  key={device.id}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {device.deviceName}
                    </p>
                    <p className="text-xs text-muted">
                      {device.deviceType} &middot; Last active{" "}
                      {new Date(device.lastActiveAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleForceLogin(device.id)}
                    disabled={replacingSession === device.id}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {replacingSession === device.id ? "Replacing..." : "Replace"}
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setDeviceLimit(null)}
              className="w-full text-center text-sm text-muted hover:text-foreground transition-colors"
            >
              Back to sign in
            </button>
          </div>
        )}

        <p className="text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
