"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { loginAction } from "./actions";
import { buttonStyles } from "@/components/ui/button";
import type { LoginState } from "@/lib/auth/types";

const initialState: LoginState = { status: "idle" };

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      <div>
        <label htmlFor="email" className="text-sm font-medium text-brand-green-deep">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
          placeholder="admin@edenbites.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-brand-green-deep">
          Password
        </label>
        <div className="relative mt-2">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="h-12 w-full rounded-xl border border-border bg-white px-4 pr-12 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-cream hover:text-brand-green-deep"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {state.status === "error" && state.message ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={buttonStyles({ variant: "accent", size: "lg", className: "w-full" })}
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
