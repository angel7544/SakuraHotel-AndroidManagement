"use client";
import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, CheckSquare, Square } from "lucide-react";
import { Suspense } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setLoading(true);
        try {
          const roles = await (await import("@/lib/auth")).getUserRoles(supabase, session.user);
          const role = roles.includes("owner") ? "owner" : roles.includes("staff") ? "staff" : "customer";
          await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
          });
          window.location.href = redirect || "/admin";
        } catch (e) {
          console.error(e);
          setLoading(false);
        }
      }
    };
    checkSession();
  }, [router, redirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      try {
        const roles = await (await import("@/lib/auth")).getUserRoles(supabase, data.user);
        const role = roles.includes("owner") ? "owner" : roles.includes("staff") ? "staff" : "customer";
        
        const response = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });

        if (!response.ok) {
           throw new Error("Failed to create session");
        }

        // Force a hard navigation to ensure cookies are applied and middleware runs
        window.location.href = redirect || "/admin";
      } catch (e: any) {
        console.error(e);
        setError(e.message || "An unexpected error occurred during login.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-slate-900">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </div>
      
      {/* Decorative Blobs */}
      <div className="absolute top-1/4 -left-10 w-96 h-96 bg-pink-600/30 rounded-full blur-3xl -z-0 mix-blend-screen animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl -z-0 mix-blend-screen animate-pulse delay-1000"></div>

      <div className="z-6 w-full max-w-md px-2">
        {/* Glass Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white tracking-wide uppercase mb-2">
                Hotel Sakura Staff Login
              </h2>
              <p className="text-pink-200 text-sm font-medium tracking-wide">
                Empowering Excellence, Crafting Experiences.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-gray-200 text-sm font-medium ml-1">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-pink-400 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-gray-200 text-sm font-medium ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-pink-400 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <button 
                  type="button"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  {rememberMe ? (
                     <CheckSquare className="h-4 w-4 text-pink-500" />
                  ) : (
                     <Square className="h-4 w-4 text-gray-400 group-hover:text-white" />
                  )}
                  Stay connected
                </button>
                <Link href="/contact" className="text-pink-400 hover:text-pink-300 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200 mt-8"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && (
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs">
              Powered by <span className="text-gray-400 font-semibold">br31tech.live</span> <span className="mx-1 text-gray-600">|</span> Angel Mehul Singh
            </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
