"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/api";
import { useAuthStore } from "../../store/auth";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuthStore();
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "FLEET_MANAGER" as
      | "FLEET_MANAGER"
      | "DRIVER"
      | "SAFETY_OFFICER"
      | "FINANCIAL_ANALYST",
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await authClient.login(loginForm);
      login(data.token, data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await authClient.register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        role: registerForm.role,
      });
      setSuccess("Account created successfully! Switching to login...");
      setLoginForm({
        email: registerForm.email,
        password: registerForm.password,
      });
      setTimeout(() => {
        setIsSignUp(false);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-[840px] min-h-[540px] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* --- LEFT FORM AREA (SIGN IN) --- */}
        <div
          className={`w-full md:w-1/2 md:h-full flex flex-col justify-center p-6 sm:p-8 md:p-10 transition-all duration-500 ease-in-out z-10 overflow-y-auto
          ${isSignUp ? "opacity-0 pointer-events-none hidden md:flex" : "relative opacity-100 pointer-events-auto flex"}`}
        >
          <div className="w-full max-w-[320px] mx-auto space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-white mb-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">
                  T
                </div>
                <span>TransitOps</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-neutral-400 text-xs font-medium">
                Enter your credentials to manage transport assets
              </p>
            </div>

            {error && !isSignUp && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium">
                {error}
              </div>
            )}
            {success && !isSignUp && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium animate-pulse">
                {success}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@transitops.com"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, email: e.target.value })
                  }
                  className="w-full h-10 px-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all rounded-lg text-sm font-medium outline-none text-white placeholder:text-neutral-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    className="w-full h-10 pl-3 pr-10 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all rounded-lg text-sm font-medium outline-none text-white placeholder:text-neutral-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-neutral-400 font-medium">
                  <input type="checkbox" className="accent-blue-600" />
                  Remember me
                </label>
                <span className="text-neutral-600 cursor-not-allowed">
                  Forgot password?
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white h-10 transition-all rounded-lg text-sm font-semibold tracking-wide shadow-lg shadow-blue-900/10 hover:-translate-y-0.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Sign In"}
              </button>
            </form>

            <div className="text-center md:hidden">
              <span className="text-neutral-500 text-xs">
                {"Don't have an account? "}
              </span>
              <button
                onClick={() => setIsSignUp(true)}
                className="text-blue-500 hover:text-blue-400 font-bold text-xs underline"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>

        {/* --- RIGHT FORM AREA (SIGN UP) --- */}
        <div
          className={`w-full md:w-1/2 md:h-full flex flex-col justify-center p-6 sm:p-8 md:p-10 transition-all duration-500 ease-in-out z-10 overflow-y-auto
          ${!isSignUp ? "opacity-0 pointer-events-none hidden md:flex" : "relative opacity-100 pointer-events-auto flex"}`}
        >
          <div className="w-full max-w-[320px] mx-auto space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-white mb-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">
                  T
                </div>
                <span>TransitOps</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Create account
              </h2>
              <p className="text-neutral-400 text-xs font-medium">
                Join TransitOps compliance, fleet, & logistics network
              </p>
            </div>

            {error && isSignUp && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium">
                {error}
              </div>
            )}
            {success && isSignUp && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium animate-pulse">
                {success}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, name: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all rounded-lg text-sm font-medium outline-none text-white placeholder:text-neutral-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@transitops.com"
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, email: e.target.value })
                  }
                  className="w-full h-9 px-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all rounded-lg text-sm font-medium outline-none text-white placeholder:text-neutral-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Operational Role (RBAC)
                </label>
                <select
                  value={registerForm.role}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      role: e.target.value as
                        | "FLEET_MANAGER"
                        | "DRIVER"
                        | "SAFETY_OFFICER"
                        | "FINANCIAL_ANALYST",
                    })
                  }
                  className="w-full h-9 px-2 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all rounded-lg text-sm font-medium outline-none text-neutral-200"
                >
                  <option value="FLEET_MANAGER">Fleet Manager</option>
                  <option value="DRIVER">Driver</option>
                  <option value="SAFETY_OFFICER">Safety Officer</option>
                  <option value="FINANCIAL_ANALYST">Financial Analyst</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        password: e.target.value,
                      })
                    }
                    className="w-full h-9 pl-3 pr-10 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all rounded-lg text-sm font-medium outline-none text-white placeholder:text-neutral-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={registerForm.confirmPassword}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full h-9 pl-3 pr-10 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all rounded-lg text-sm font-medium outline-none text-white placeholder:text-neutral-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white h-10 transition-all rounded-lg text-sm font-semibold tracking-wide shadow-lg shadow-blue-900/10 hover:-translate-y-0.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>

            <div className="text-center md:hidden">
              <span className="text-neutral-500 text-xs">
                Already have an account?{" "}
              </span>
              <button
                onClick={() => setIsSignUp(false)}
                className="text-blue-500 hover:text-blue-400 font-bold text-xs underline"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        {/* --- SLIDING OVERLAY (Desktop) --- */}
        <div
          className={`hidden md:flex absolute top-0 h-full w-1/2 bg-blue-600/95 backdrop-blur-md z-20 text-white items-center justify-center p-8 text-center shadow-2xl overflow-hidden transition-all duration-500 ease-in-out
          ${isSignUp ? "translate-x-0 rounded-l-[1.5rem]" : "translate-x-full rounded-r-[1.5rem]"}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/40 via-transparent to-transparent opacity-80 pointer-events-none" />

          <div className="relative z-10 space-y-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/10 text-white rounded-full flex items-center justify-center border border-white/20 shadow-xl shadow-blue-950/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M13 16h2l4-2M13 12h7m-1 4h2a1 1 0 001-1v-4a1 1 0 00-1-1h-3"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight">
                {isSignUp ? "Already registered?" : "New to TransitOps?"}
              </h3>
              <p className="text-blue-100 text-xs leading-relaxed max-w-xs mx-auto font-medium">
                {isSignUp
                  ? "Log in with your operational credentials to monitor active trips, vehicles, and analytics."
                  : "Create an account to digitize logistics, fleet assets, maintenance logs, and fuel tracking."}
              </p>
            </div>

            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="px-8 py-2.5 text-xs rounded-full bg-white hover:bg-neutral-50 active:scale-95 text-blue-600 transition-all font-bold tracking-wide shadow-xl hover:-translate-y-0.5"
            >
              {isSignUp ? "Sign In" : "Create Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
