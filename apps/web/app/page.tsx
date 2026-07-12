"use client";

import React, { useState, useEffect } from "react";
import { authClient } from "../lib/api";
import { useAuthStore } from "../store/auth";

export default function AuthPage() {
  const { token, user, isAuthenticated, login, logout } = useAuthStore();

  // Navigation / sliding state
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
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

  // Client hydration guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await authClient.login(loginForm);
      login(data.token, data.user);
      setSuccess("Login successful!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Register handler
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

  // Quick Login trigger
  const handleQuickLogin = async (email: string, roleName: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setIsSignUp(false);

    const form = { email, password: "password123" };
    setLoginForm(form);

    try {
      const data = await authClient.login(form);
      login(data.token, data.user);
      setSuccess(`Authenticated successfully as ${roleName}!`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "API offline";
      setError(
        `Quick login failed: ${errMsg}. Ensure the API server is running.`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Logged-in dashboard mock screen
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Accent Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Session Established
              </h1>
              <p className="text-xs text-neutral-400">
                Authenticated Token & Security Claims Verified
              </p>
            </div>

            <div className="w-full bg-neutral-950/50 border border-neutral-800/80 rounded-xl p-4 text-left space-y-3.5 text-sm">
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400 font-medium">User Name:</span>
                <span className="font-semibold text-neutral-200">
                  {user.name}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400 font-medium">
                  Email Address:
                </span>
                <span className="font-semibold text-neutral-200">
                  {user.email}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400 font-medium">
                  RBAC Claim:
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 tracking-wider">
                  {user.role}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-neutral-400 font-medium">
                  Bearer JWT Token:
                </span>
                <span className="text-[10px] font-mono text-neutral-500 break-all bg-neutral-950 p-2 rounded border border-neutral-800 select-all max-h-20 overflow-y-auto">
                  {token}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                setLoginForm({ email: "", password: "" });
                setError(null);
                setSuccess(null);
              }}
              className="w-full bg-neutral-800 hover:bg-neutral-700 active:scale-[0.98] text-neutral-100 font-bold py-2.5 rounded-xl transition-all border border-neutral-700"
            >
              Log Out Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main card */}
      <div className="relative w-full max-w-[840px] min-h-[540px] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* --- LEFT FORM AREA (SIGN IN / FORGOT) --- */}
        <div
          className={`w-full md:w-1/2 flex flex-col p-6 sm:p-8 md:p-10 transition-all duration-500 ease-in-out z-10 overflow-y-auto
          ${isSignUp ? "opacity-0 pointer-events-none hidden md:flex md:h-full" : "relative opacity-100 pointer-events-auto block"}`}
        >
          <div className="w-full max-w-[320px] mx-auto my-auto space-y-6">
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
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
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
          className={`w-full md:w-1/2 flex flex-col p-6 sm:p-8 md:p-10 transition-all duration-500 ease-in-out z-10 overflow-y-auto
          ${!isSignUp ? "opacity-0 pointer-events-none hidden md:flex md:h-full" : "relative opacity-100 pointer-events-auto block"}`}
        >
          <div className="w-full max-w-[320px] mx-auto my-auto space-y-6">
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
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
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
                    {showConfirmPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
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

        {/* --- THE SLIDING OVERLAY (Desktop Only) --- */}
        <div
          className={`hidden md:flex absolute top-0 h-full w-1/2 bg-blue-600/95 backdrop-blur-md z-20 text-white items-center justify-center p-8 text-center shadow-2xl overflow-hidden transition-all duration-500 ease-in-out
          ${isSignUp ? "translate-x-0 rounded-l-[1.5rem]" : "translate-x-full rounded-r-[1.5rem]"}`}
        >
          {/* Accent radial glow inside the overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/40 via-transparent to-transparent opacity-80 pointer-events-none" />

          <div className="relative z-10 space-y-6 flex flex-col items-center">
            {/* Smooth truck animation SVG placeholder */}
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

      {/* --- QUICK-LOGIN DEMO SWITCHER PANEL --- */}
      <div className="w-full max-w-[840px] mt-8 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 space-y-4 shadow-xl text-center">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5 uppercase tracking-wider">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 7a2 2 0 012 2m0 0a2 2 0 01-2 2m2-2a2 2 0 00-2-2m0 0a2 2 0 00-2 2m2 2a2 2 0 012 2m0 0a2 2 0 01-2 2m2-2a2 2 0 01-2-2m0 0a2 2 0 01-2-2m0 0a2 2 0 00-2 2m2 2a2 2 0 002 2m0 0a2 2 0 002-2"
              />
            </svg>
            Reviewer Quick-Access Console
          </h4>
          <p className="text-[11px] text-neutral-400 font-medium">
            Click any role to bypass manually entering passwords and test
            role-specific RBAC credentials
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <button
            onClick={() =>
              handleQuickLogin("manager@transitops.com", "Fleet Manager")
            }
            disabled={loading}
            className="group flex flex-col items-center justify-center p-3 bg-neutral-950 hover:bg-neutral-800/80 active:scale-[0.97] rounded-xl border border-neutral-800 hover:border-blue-500/40 transition-all text-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <span className="text-[11px] font-bold text-neutral-200 group-hover:text-blue-400 transition-colors">
              Fleet Manager
            </span>
            <span className="text-[9px] text-neutral-500 font-medium leading-none">
              manager@transitops.com
            </span>
          </button>

          <button
            onClick={() =>
              handleQuickLogin("driver@transitops.com", "Alex Driver")
            }
            disabled={loading}
            className="group flex flex-col items-center justify-center p-3 bg-neutral-950 hover:bg-neutral-800/80 active:scale-[0.97] rounded-xl border border-neutral-800 hover:border-emerald-500/40 transition-all text-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <span className="text-[11px] font-bold text-neutral-200 group-hover:text-emerald-400 transition-colors">
              Alex Driver
            </span>
            <span className="text-[9px] text-neutral-500 font-medium leading-none">
              driver@transitops.com
            </span>
          </button>

          <button
            onClick={() =>
              handleQuickLogin("safety@transitops.com", "Safety Officer")
            }
            disabled={loading}
            className="group flex flex-col items-center justify-center p-3 bg-neutral-950 hover:bg-neutral-800/80 active:scale-[0.97] rounded-xl border border-neutral-800 hover:border-amber-500/40 transition-all text-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <span className="text-[11px] font-bold text-neutral-200 group-hover:text-amber-400 transition-colors">
              Safety Officer
            </span>
            <span className="text-[9px] text-neutral-500 font-medium leading-none">
              safety@transitops.com
            </span>
          </button>

          <button
            onClick={() =>
              handleQuickLogin("finance@transitops.com", "Financial Analyst")
            }
            disabled={loading}
            className="group flex flex-col items-center justify-center p-3 bg-neutral-950 hover:bg-neutral-800/80 active:scale-[0.97] rounded-xl border border-neutral-800 hover:border-purple-500/40 transition-all text-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <span className="text-[11px] font-bold text-neutral-200 group-hover:text-purple-400 transition-colors">
              Financial Analyst
            </span>
            <span className="text-[9px] text-neutral-500 font-medium leading-none">
              finance@transitops.com
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
