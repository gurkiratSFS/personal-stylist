"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  type AuthActionState,
  requestPasswordReset,
  signIn,
  signUp,
  updatePassword,
} from "@/app/auth/actions";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { error: null, message: null };

type AuthFormProps =
  | { mode: "signup" | "login" }
  | { mode: "forgot" }
  | { mode: "update-password" };

export function AuthForm(props: AuthFormProps) {
  const action =
    props.mode === "signup"
      ? signUp
      : props.mode === "login"
        ? signIn
        : props.mode === "forgot"
          ? requestPasswordReset
          : updatePassword;

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {props.mode !== "update-password" ? (
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-12"
          />
        </div>
      ) : null}

      {props.mode !== "forgot" ? (
        <PasswordField
          label={
            props.mode === "update-password" ? "New password" : "Password"
          }
          autoComplete={
            props.mode === "signup" || props.mode === "update-password"
              ? "new-password"
              : "current-password"
          }
        />
      ) : null}

      {props.mode === "login" ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              name="remember"
              className="size-4 rounded border-border"
              defaultChecked
            />
            Keep me signed in
          </label>
          <Link
            href="/forgot-password"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Forgot password
          </Link>
        </div>
      ) : null}

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-lg bg-mist px-3 py-2 text-sm text-foreground" role="status">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="h-12 text-base">
        {pending
          ? "Working…"
          : props.mode === "signup"
            ? "Create account"
            : props.mode === "login"
              ? "Sign in"
              : props.mode === "forgot"
                ? "Send reset link"
                : "Update password"}
      </Button>
    </form>
  );
}
