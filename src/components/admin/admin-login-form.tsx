"use client";

import { useActionState } from "react";

import { enterAdmin, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(enterAdmin, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="admin-password">Senha de administrador</Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          aria-describedby={state.error ? "admin-password-error" : undefined}
        />
      </div>
      {state.error ? (
        <p id="admin-password-error" className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Verificando..." : "Entrar no admin"}
      </Button>
    </form>
  );
}
