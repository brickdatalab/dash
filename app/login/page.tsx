"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.replace("/");
        router.refresh();
      } else {
        setError("Invalid username or password");
      }
    } catch {
      setError("Sign-in failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-[15px] font-medium text-center mb-8 text-[var(--color-fg)]">
          Enter password for Mirror Dash
        </h1>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-muted)] mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-[14px] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] bg-white"
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-muted)] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-[14px] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] bg-white"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <div className="text-[12px] text-[var(--color-negative)] text-center pt-1">{error}</div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-3 py-2 mt-2 text-[13px] font-medium bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
