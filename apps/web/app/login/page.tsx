"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-sm" />
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

  const inputClasses =
    "w-full h-10 px-3.5 bg-white/45 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/70 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all rounded-xl text-sm font-semibold outline-none text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Dynamic Background Blur Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 dark:bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Glassmorphism container */}
      <div className="relative w-full max-w-[840px] min-h-[580px] bg-white/50 dark:bg-slate-900/35 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
        {/* --- LEFT FORM AREA (SIGN IN) --- */}
        <div
          className={`w-full md:w-1/2 md:h-full flex flex-col justify-center p-6 sm:p-8 md:p-10 transition-all duration-500 ease-in-out z-10 overflow-y-auto
          ${isSignUp ? "opacity-0 pointer-events-none hidden md:flex" : "relative opacity-100 pointer-events-auto flex"}`}
        >
          <div className="w-full max-w-[320px] mx-auto space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-black text-xl tracking-tight text-primary mb-2">
                <span>TransitOps</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">
                Enter your credentials to manage transport assets
              </p>
            </div>

            {error && !isSignUp && (
              <div className="p-3.5 bg-rose-50/90 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-800 dark:text-rose-400 text-xs font-bold leading-relaxed">
                {error}
              </div>
            )}
            {success && !isSignUp && (
              <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-400 text-xs font-bold animate-pulse leading-relaxed">
                {success}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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
                  className={inputClasses}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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
                    className={`${inputClasses} pr-14`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded-lg border-slate-200 text-primary focus:ring-primary accent-primary"
                  />
                  Remember me
                </label>
                <span className="text-slate-400 dark:text-slate-600 cursor-not-allowed">
                  Forgot password?
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/95 text-white h-11 transition-all rounded-xl font-bold tracking-wide shadow-lg shadow-primary/20 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Verifying..." : "Sign In"}
              </button>
            </form>

            <div className="text-center md:hidden pt-2">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                {"Don't have an account? "}
              </span>
              <button
                onClick={() => setIsSignUp(true)}
                className="text-primary hover:text-primary/80 font-black text-xs underline"
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
          <div className="w-full max-w-[320px] mx-auto space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-xl tracking-tight text-primary mb-1">
                <span>TransitOps</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Create account
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">
                Join TransitOps logistics & compliance network
              </p>
            </div>

            {error && isSignUp && (
              <div className="p-3 bg-rose-50/90 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-800 dark:text-rose-400 text-xs font-bold leading-relaxed">
                {error}
              </div>
            )}
            {success && isSignUp && (
              <div className="p-3 bg-emerald-50/90 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-400 text-xs font-bold animate-pulse leading-relaxed">
                {success}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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
                  className={inputClasses}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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
                  className={inputClasses}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Operational Role
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
                  className={`${inputClasses} appearance-none cursor-pointer`}
                >
                  <option value="FLEET_MANAGER">Fleet Manager</option>
                  <option value="DRIVER">Driver</option>
                  <option value="SAFETY_OFFICER">Safety Officer</option>
                  <option value="FINANCIAL_ANALYST">Financial Analyst</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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
                    className={`${inputClasses} pr-14`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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
                    className={`${inputClasses} pr-14`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/95 text-white h-11 transition-all rounded-xl font-bold tracking-wide shadow-lg shadow-primary/20 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] mt-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>

            <div className="text-center md:hidden pt-2">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                Already have an account?{" "}
              </span>
              <button
                onClick={() => setIsSignUp(false)}
                className="text-primary hover:text-primary/80 font-black text-xs underline"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        {/* --- SLIDING OVERLAY (Desktop) --- */}
        <div
          className={`hidden md:flex absolute top-0 h-full w-1/2 bg-primary dark:bg-primary/95 z-20 text-white items-center justify-center p-8 text-center shadow-2xl overflow-hidden transition-all duration-500 ease-in-out
          ${isSignUp ? "translate-x-0 rounded-l-[1.5rem]" : "translate-x-full rounded-r-[1.5rem]"}`}
        >
          {/* Circular gradient light highlights */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 dark:from-slate-900/15 via-transparent to-transparent opacity-80 pointer-events-none" />

          <div className="relative z-10 space-y-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center border border-white/20 shadow-xl shadow-primary/5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
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
              <h3 className="text-lg font-black tracking-tight uppercase">
                {isSignUp ? "Already registered?" : "New to TransitOps?"}
              </h3>
              <p className="text-teal-50 dark:text-teal-100 text-xs leading-relaxed max-w-[240px] mx-auto font-semibold">
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
              className="px-8 py-2.5 text-xs rounded-full bg-white hover:bg-teal-50 hover:scale-105 active:scale-95 text-primary transition-all font-black tracking-wider shadow-lg hover:-translate-y-0.5 cursor-pointer"
            >
              {isSignUp ? "Sign In" : "Create Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
