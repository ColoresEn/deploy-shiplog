"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { ENTRY_KINDS, KIND_LABEL } from "@/lib/constants";
import type { ActionState } from "@/app/actions/projects";
import type { Tables } from "@/lib/database.types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  projectId: string;
  slug: string;
  entry?: Tables<"entries">;
  today: string;
};

export function EntryForm({ action, projectId, slug, entry, today }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!entry && !pending && state === undefined) formRef.current?.reset();
  }, [entry, pending, state]);

  return (
    <form ref={formRef} action={formAction}>
      <div className="border border-border p-4 grid gap-4">
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="slug" value={slug} />
        {entry ? <input type="hidden" name="id" value={entry.id} /> : null}

        <div className="grid gap-4 sm:grid-cols-[1fr_140px_150px]">
          <div className="grid gap-2">
            <Label htmlFor="title" className="font-mono text-xs">¿qué construiste?</Label>
            <Input id="title" name="title" required maxLength={140} placeholder="Ej: Login con magic link" defaultValue={entry?.title} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="kind" className="font-mono text-xs">tipo</Label>
            <Select
              name="kind"
              defaultValue={entry?.kind ?? "feature"}
              items={ENTRY_KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))}
            >
              <SelectTrigger id="kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTRY_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="shipped_at" className="font-mono text-xs">fecha</Label>
            <Input id="shipped_at" name="shipped_at" type="date" required defaultValue={entry?.shipped_at ?? today} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="tokens" className="font-mono text-xs">tokens gastados (opcional)</Label>
            <Input id="tokens" name="tokens" type="number" min={0} step={1} inputMode="numeric" placeholder="0" defaultValue={entry?.tokens ? String(entry.tokens) : ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cost_usd" className="font-mono text-xs">costo en USD (opcional)</Label>
            <Input id="cost_usd" name="cost_usd" type="number" min={0} step="0.0001" inputMode="decimal" placeholder="0.00" defaultValue={entry?.cost_usd ? String(entry.cost_usd) : ""} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="body" className="font-mono text-xs">detalle (opcional)</Label>
          <Textarea id="body" name="body" rows={entry ? 5 : 2} defaultValue={entry?.body ?? ""} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tags" className="font-mono text-xs">tags (separados por coma)</Label>
          <Input id="tags" name="tags" placeholder="auth, ui" defaultValue={entry?.tags.join(", ")} />
        </div>

        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

        <div className="flex justify-end gap-2">
          {entry ? (
            <Link href={`/projects/${slug}`}>
              <Button variant="ghost" size="sm" className="font-mono text-xs">cancelar</Button>
            </Link>
          ) : null}
          <Button type="submit" disabled={pending} className="font-mono text-xs">
            {pending ? "guardando…" : entry ? "guardar" : "registrar avance"}
          </Button>
        </div>
      </div>
    </form>
  );
}
