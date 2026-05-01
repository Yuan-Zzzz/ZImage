"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Win95Input from "@/components/win95/Win95Input";
import Win95Button from "@/components/win95/Win95Button";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Login failed");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 font-sans text-sm">
      <label className="block space-y-1">
        <span className="block">Username</span>
        <Win95Input value={username} onChange={setUsername} required />
      </label>
      <label className="block space-y-1">
        <span className="block">Password</span>
        <Win95Input
          type="password"
          value={password}
          onChange={setPassword}
          required
        />
      </label>
      {error && (
        <div className="win95-inset bg-win95-panel p-2 text-win95-red">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Win95Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Win95Button>
      </div>
    </form>
  );
}
