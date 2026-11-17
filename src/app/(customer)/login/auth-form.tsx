"use client";

import { useActionState, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { customerLoginAction, customerSignUpAction, type CustomerAuthState } from "./actions";

const initial: CustomerAuthState = { status: "idle" };

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.24 1.26-.96 2.33-2.04 3.05l3.3 2.56c1.93-1.78 3.04-4.4 3.04-7.51 0-.72-.06-1.42-.19-2.09H12z" />
      <path fill="#34A853" d="M12 22c2.76 0 5.07-.91 6.76-2.49l-3.3-2.56c-.91.61-2.08.97-3.46.97-2.66 0-4.92-1.8-5.73-4.21H2.86v2.64A9.997 9.997 0 0 0 12 22z" />
      <path fill="#4A90E2" d="M6.27 13.71A6.01 6.01 0 0 1 5.96 12c0-.59.1-1.17.31-1.71V7.65H2.86A9.997 9.997 0 0 0 2 12c0 1.61.39 3.14 1.08 4.49l3.19-2.78z" />
      <path fill="#FBBC05" d="M12 5.98c1.5 0 2.85.52 3.91 1.53l2.93-2.93C17.06 2.98 14.75 2 12 2a9.997 9.997 0 0 0-9.14 5.65l3.41 2.64c.81-2.41 3.07-4.31 5.73-4.31z" />
    </svg>
  );
}

export function CustomerAuthForm({ nextPath }: { nextPath?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loginState, loginAction, loginPending] = useActionState(customerLoginAction, initial);
  const [signUpState, signUpAction, signUpPending] = useActionState(customerSignUpAction, initial);
  const state = mode === "login" ? loginState : signUpState;
  const pending = mode === "login" ? loginPending : signUpPending;

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-[#14532D]">Welcome Back!</h1>
      <p className="mt-1 text-sm text-gray-600">Sign in to continue ordering your favourite meals.</p>

      <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-[#F4F6EE] p-1.5">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={cn(
            "relative flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold",
            mode === "login" ? "bg-[#14532D] text-white shadow-sm" : "font-semibold text-gray-700",
          )}
        >
          <User className={cn("size-4", mode === "login" ? "text-white" : "text-[#14532D]")} aria-hidden="true" />
          Log In
          {mode === "login" ? <span className="absolute bottom-1 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-[#A3E635]" /> : null}
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={cn(
            "relative flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold",
            mode === "signup" ? "bg-[#14532D] text-white shadow-sm" : "font-semibold text-gray-700",
          )}
        >
          <UserPlus className={cn("size-4", mode === "signup" ? "text-white" : "text-[#14532D]")} aria-hidden="true" />
          Create Account
          {mode === "signup" ? <span className="absolute bottom-1 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-[#A3E635]" /> : null}
        </button>
      </div>

      {mode === "login" ? (
        <form action={loginAction} className="mt-5 space-y-3.5">
          {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
          <label className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-5 py-3.5 text-sm">
            <Mail className="size-4 shrink-0 text-[#14532D]" aria-hidden="true" />
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email address"
              className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-500"
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-full border border-gray-200 bg-white px-5 py-3.5 text-sm">
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <Lock className="size-4 shrink-0 text-[#14532D]" aria-hidden="true" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="Password"
                className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-500"
              />
            </span>
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="text-gray-500">
              {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
          </label>

          <div className="flex items-center justify-between px-1 pt-0.5">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="remember" className="size-4 rounded border-gray-300 text-[#14532D] focus:ring-[#14532D]" /> Remember me
            </label>
            <button type="button" className="text-sm font-bold text-[#14532D] hover:underline">Forgot password?</button>
          </div>

          {state.status === "error" && state.message ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{state.message}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-full bg-[#14532D] py-4 text-base font-bold text-white shadow-md hover:bg-[#113E24] disabled:opacity-60"
          >
            {pending ? "Signing in..." : "Log In"} {!pending ? <ArrowRight className="size-5" aria-hidden="true" /> : null}
          </button>
        </form>
      ) : (
        <form action={signUpAction} className="mt-5 space-y-3.5">
          {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
          <label className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-5 py-3.5 text-sm">
            <User className="size-4 shrink-0 text-[#14532D]" aria-hidden="true" />
            <input name="name" required placeholder="Full name" className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-500" />
          </label>
          <label className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-5 py-3.5 text-sm">
            <Mail className="size-4 shrink-0 text-[#14532D]" aria-hidden="true" />
            <input name="email" type="email" autoComplete="email" required placeholder="Email address" className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-500" />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-full border border-gray-200 bg-white px-5 py-3.5 text-sm">
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <Lock className="size-4 shrink-0 text-[#14532D]" aria-hidden="true" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Password (min 6 characters)"
                className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-500"
              />
            </span>
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="text-gray-500">
              {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
          </label>

          {state.status === "error" && state.message ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{state.message}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-full bg-[#14532D] py-4 text-base font-bold text-white shadow-md hover:bg-[#113E24] disabled:opacity-60"
          >
            {pending ? "Creating account..." : "Create Account"} {!pending ? <ArrowRight className="size-5" aria-hidden="true" /> : null}
          </button>
          <p className="text-center text-xs text-gray-600">No email confirmation needed — you&apos;re good to go.</p>
        </form>
      )}

      <div className="my-4 flex items-center justify-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" /> OR <span className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-800 shadow-sm hover:bg-gray-50"
      >
        <GoogleIcon className="size-5" /> Continue with Google
      </button>

      <p className="mt-5 text-center text-sm text-gray-600">
        {mode === "login" ? "Don\u2019t have an account? " : "Already have an account? "}
        <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-bold text-[#14532D] hover:underline">
          {mode === "login" ? "Create Account" : "Log In"}
        </button>
      </p>
    </div>
  );
}
