"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { register, validateReferralCode } from "@/api/auth";
import type { ReferralValidation } from "@/types/auth";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [codeStatus, setCodeStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const [referrerName, setReferrerName] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill referral code from URL or sessionStorage
  useEffect(() => {
    const urlCode = searchParams.get("c");
    if (urlCode) {
      setReferralCode(urlCode);
    } else {
      const stored = sessionStorage.getItem("referralCode");
      if (stored) {
        setReferralCode(stored);
      }
    }
  }, [searchParams]);

  const validateCode = useCallback((code: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!code.trim()) {
      setCodeStatus("idle");
      setReferrerName("");
      return;
    }

    setCodeStatus("checking");

    debounceRef.current = setTimeout(async () => {
      const result: ReferralValidation = await validateReferralCode(code.trim());
      if (result.valid && result.referrerName) {
        setCodeStatus("valid");
        setReferrerName(result.referrerName);
      } else {
        setCodeStatus("invalid");
        setReferrerName("");
      }
    }, 500);
  }, []);

  // Trigger validation when referralCode changes
  useEffect(() => {
    validateCode(referralCode);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [referralCode, validateCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        referralCode: referralCode.trim(),
      });
      router.push("/");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string } } };
      const code = axiosErr.response?.data?.code;
      if (code === "ACCOUNT_EXISTS") {
        setError("Account already exists.");
      } else if (code === "INVALID_REFERRAL_CODE") {
        setError("Invalid referral code.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
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
            Create your account
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
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
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="0712345678"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label htmlFor="referralCode" className="block text-sm font-medium text-foreground mb-1">
              Invite Code
            </label>
            <input
              id="referralCode"
              type="text"
              required
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Enter your invite code"
            />
            {codeStatus === "checking" && (
              <p className="mt-1 text-xs text-white/60">Checking code...</p>
            )}
            {codeStatus === "valid" && (
              <p className="mt-1 text-xs text-green-500">
                Invited by {referrerName}.
              </p>
            )}
            {codeStatus === "invalid" && (
              <p className="mt-1 text-xs text-red-400">Invalid invite code</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
