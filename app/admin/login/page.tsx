"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "../actions";

const initial: SignInState = {};

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <main className="grid min-h-dvh place-items-center bg-court px-6 text-bone">
      <div className="w-full max-w-sm">
        <p className="font-body text-caption font-semibold uppercase tracking-[0.18em] text-orange">
          ETCODE 4 · Command center
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase">Admin sign-in</h1>
        <p className="mt-2 text-sm text-bone/60">
          Provisioned accounts only. No public sign-up.
        </p>

        <form action={action} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-bone/80">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-lg border border-bone/15 bg-bone/[0.03] px-3.5 py-2.5 text-bone outline-none focus-visible:border-orange focus-visible:ring-2 focus-visible:ring-orange/40"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-bone/80">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-lg border border-bone/15 bg-bone/[0.03] px-3.5 py-2.5 text-bone outline-none focus-visible:border-orange focus-visible:ring-2 focus-visible:ring-orange/40"
            />
          </label>

          {state.error ? (
            <p
              role="alert"
              className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-orange px-4 py-2.5 font-body text-caption font-semibold uppercase tracking-[0.16em] text-court transition-opacity disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
