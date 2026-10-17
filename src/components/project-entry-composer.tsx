"use client";

import { useState, useTransition } from "react";
import { getGitHubSuggestions, type GitHubSuggestion } from "@/app/actions/github";
import { createEntry } from "@/app/actions/entries";
import { EntryForm } from "@/components/entry-form";
import { Button } from "@/components/ui/button";
import { KIND_LABEL } from "@/lib/constants";

function GitHubSuggestions({
  projectId,
  onSelect,
}: {
  projectId: string;
  onSelect: (suggestion: GitHubSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<GitHubSuggestion[] | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function loadSuggestions() {
    setError("");
    startTransition(async () => {
      try {
        const result = await getGitHubSuggestions(projectId);
        if ("error" in result) {
          setError(result.error);
        } else {
          setSuggestions(result.suggestions);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las sugerencias.");
      }
    });
  }

  return (
    <section className="mb-4 border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mono text-xs">sugerencias de GitHub</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Revisa commits recientes y PRs mergeados para convertirlos en entradas.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="font-mono text-xs" disabled={isPending} onClick={loadSuggestions}>
          {isPending ? "buscando…" : suggestions ? "actualizar" : "buscar cambios"}
        </Button>
      </div>

      {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
      {suggestions ? (
        suggestions.length ? (
          <ul className="mt-4 divide-y divide-border">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm">{suggestion.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground font-mono">
                    {suggestion.source === "pull_request" ? "PR mergeado" : "commit"} · {suggestion.shippedAt} · {KIND_LABEL[suggestion.kind]}
                  </p>
                  <a href={suggestion.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-accent hover:underline">
                    ver en GitHub
                  </a>
                </div>
                <Button type="button" variant="outline" size="sm" className="font-mono text-xs" onClick={() => onSelect(suggestion)}>
                  usar sugerencia
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No hay commits ni PRs mergeados recientes para sugerir.</p>
        )
      ) : null}
    </section>
  );
}

export function ProjectEntryComposer({
  projectId,
  slug,
  today,
}: {
  projectId: string;
  slug: string;
  today: string;
}) {
  const [suggestion, setSuggestion] = useState<GitHubSuggestion>();

  return (
    <>
      <GitHubSuggestions projectId={projectId} onSelect={setSuggestion} />
      <EntryForm
        key={suggestion?.id ?? "new-entry"}
        action={createEntry}
        projectId={projectId}
        slug={slug}
        today={today}
        suggestion={suggestion}
        onSaved={() => setSuggestion(undefined)}
      />
    </>
  );
}
