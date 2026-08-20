"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import PipelineVisual from "@/components/PipelineVisual";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.register(email, password);
      const data = await api.login(email, password);
      setToken(data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex items-center justify-center bg-base-900 border-r border-base-700 p-12">
        <div className="max-w-md w-full">
          <PipelineVisual />
          <p className="text-center text-base-600 text-sm font-mono mt-4">
            document → embeddings → cited answer
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-electric-500 shadow-glow" />
              <span className="text-xs font-mono text-base-600 tracking-widest uppercase">Neuralix Labs</span>
            </div>
            <h1 className="font-display text-3xl font-semibold text-white">Create account</h1>
            <p className="text-base-600 mt-2 text-sm">Start uploading and querying your documents.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-base-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-base-900 border border-base-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-base-600 focus:border-electric-500 focus:outline-none transition-colors"
                placeholder="you@neuralixlabs.in"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-base-600 mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-base-900 border border-base-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-base-600 focus:border-electric-500 focus:outline-none transition-colors"
                placeholder="At least 8 characters"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-electric-500 hover:bg-electric-400 disabled:opacity-50 text-white font-medium text-sm rounded-lg py-2.5 transition-colors shadow-glow"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-sm text-base-600 mt-6 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-electric-400 hover:text-electric-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
