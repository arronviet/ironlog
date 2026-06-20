"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-semibold">IL</span>
          </div>
          <span className="text-sm font-medium text-foreground">IronLog</span>
        </div>

        <h1 className="text-xl font-semibold text-foreground mb-1">Create your account</h1>
        <p className="text-sm text-muted-foreground mb-6">Start tracking your progress today</p>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5" htmlFor="full_name">
              Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              placeholder="Your name"
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
