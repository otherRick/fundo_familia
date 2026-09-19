"use client";

import { useActionState, useState } from "react";

import { registerContribution } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NEW = "__new__";

export function ContributionForm({ names }: { names: string[] }) {
  const [state, formAction, pending] = useActionState(registerContribution, {});
  const [person, setPerson] = useState(names[0] ?? NEW);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="person">Pessoa</Label>
        <select
          id="person"
          name="personName"
          value={person}
          onChange={(event) => setPerson(event.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {names.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          <option value={NEW}>+ Adicionar novo nome</option>
        </select>
      </div>

      {person === NEW && (
        <div className="space-y-2">
          <Label htmlFor="newPersonName">Novo nome</Label>
          <Input
            id="newPersonName"
            name="newPersonName"
            placeholder="Nome do novo contribuinte"
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount">Valor (R$)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="0,00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <Input id="date" name="date" type="date" defaultValue={today} required />
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
        {pending ? "Salvando..." : "Registrar contribuição"}
      </Button>
    </form>
  );
}
