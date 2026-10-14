import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABEL, type ProjectStatus } from "@/lib/constants";
import { createEntry } from "@/app/actions/entries";
import { EntryForm } from "@/components/entry-form";
import { Timeline } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/database.types";

const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function totals(entries: Tables<"entries">[]) {
  const tokens = entries.reduce((acc, e) => acc + e.tokens, 0);
  const costUsd = entries.reduce((acc, e) => acc + Number(e.cost_usd), 0);
  return { tokens, costUsd };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!project) notFound();

  const { data: entries } = await supabase
    .from("entries")
    .select("*")
    .eq("project_id", project.id)
    .order("shipped_at", { ascending: false })
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const { tokens, costUsd } = totals(entries ?? []);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Link href="/" className="hover:text-foreground">proyectos</Link>
            <span>/</span>
            <span className="text-accent">{STATUS_LABEL[project.status as ProjectStatus]}</span>
          </p>
          <h1 className="text-lg font-medium mt-1">{project.name}</h1>
          {project.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
          ) : null}
          {project.repo_url ? (
            <a href={project.repo_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-muted-foreground hover:text-foreground font-mono">
              {project.repo_url.replace(/^https?:\/\//, "")}
            </a>
          ) : null}
        </div>
        <Link href={`/projects/${project.slug}/edit`}>
          <Button variant="ghost" size="sm" className="font-mono text-xs">
            editar
          </Button>
        </Link>
      </div>

      {(tokens > 0 || costUsd > 0) ? (
        <p className="mt-4 text-xs text-muted-foreground font-mono">
          total invertido:{" "}
          {tokens > 0 ? <>{tokens.toLocaleString()} tokens</> : null}
          {tokens > 0 && costUsd > 0 ? " · " : null}
          {costUsd > 0 ? <>{usdFmt.format(costUsd)}</> : null}
        </p>
      ) : null}

      <div className="mt-6">
        <EntryForm action={createEntry} projectId={project.id} slug={project.slug} today={today} />
      </div>

      <div className="mt-8">
        <Timeline entries={entries ?? []} slug={project.slug} />
      </div>
    </>
  );
}
