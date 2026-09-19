"use client";

import { useActionState } from "react";

import { importB3 } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImportForm() {
  const [state, formAction, pending] = useActionState(importB3, {});

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">Arquivo XLSX da B3</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept=".xlsx,.xls"
          required
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-primary" role="status">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Importando..." : "Importar posição"}
      </Button>
    </form>
  );
}
