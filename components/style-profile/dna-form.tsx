"use client";

import { useActionState } from "react";

import { saveStyleDna, type StyleActionState } from "@/app/style-profile/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: StyleActionState = { error: null, message: null };

const fields = [
  { name: "summary", label: "Summary", rows: 3 },
  { name: "goals", label: "Goals", rows: 2 },
  { name: "palette_notes", label: "Palette notes", rows: 2 },
  { name: "fit_notes", label: "Fit notes", rows: 2 },
  { name: "grooming_notes", label: "Grooming notes", rows: 2 },
  { name: "shopping_notes", label: "Shopping notes", rows: 2 },
] as const;

export function DnaForm({
  defaults,
}: {
  defaults: Record<(typeof fields)[number]["name"], string | null>;
}) {
  const [state, formAction, pending] = useActionState(saveStyleDna, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Based on your answers — edit freely. This is not an AI attractiveness report.
      </p>
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <textarea
            id={field.name}
            name={field.name}
            rows={field.rows}
            defaultValue={defaults[field.name] ?? ""}
            className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      ))}
      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-muted-foreground" role="status">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Style DNA"}
      </Button>
    </form>
  );
}
