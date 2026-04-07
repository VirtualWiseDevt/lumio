"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { login, forceLogin } from "@/api/auth";
import type { DeviceLimitResponse } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          <Link href="/" className="font-display text-[28px] font-black tracking-[3px]">
            <span className="text-white">L</span>
            <span className="text-gold">&#x25C8;</span>
            <span className="text-white">MIO</span>
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-white">
            Sign in to your account
          </h1>
        </div>

        {!deviceLimit ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red/10 border border-red/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-[#555] bg-[#333] px-3 py-2.5 text-white placeholder:text-silver focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-[#555] bg-[#333] px-3 py-2.5 pr-10 text-white placeholder:text-silver focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-gold px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-gold-bright disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="rounded-md bg-red/10 border border-red/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="rounded-md bg-gold/10 border border-gold/20 px-4 py-3 text-sm text-gold">
              You have reached the maximum number of devices.
            </div>

            <p className="text-sm text-silver">
              Choose a device to replace with this one:
            </p>

            <ul className="space-y-2">
              {deviceLimit.devices.map((device) => (
                <li
                  key={device.id}
                  className="flex items-center justify-between rounded border border-[#333] bg-card px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {device.deviceName}
                    </p>
                    <p className="text-xs text-silver">
                      {device.deviceType} &middot; Last active{" "}
                      {new Date(device.lastActiveAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleForceLogin(device.id)}
                    disabled={replacingSession === device.id}
                    className="rounded bg-red px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red/80 disabled:opacity-50"
                  >
                    {replacingSession === device.id ? "Replacing..." : "Replace"}
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setDeviceLimit(null)}
              className="w-full text-center text-sm text-silver hover:text-white transition-colors"
            >
              Back to sign in
            </button>
          </div>
        )}

        <p className="text-center text-sm text-silver">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-gold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
