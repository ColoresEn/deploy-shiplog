import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABEL, type ProjectStatus } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, slug, description, status, entries(count)")
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-sm">proyectos</h1>
        <Link href="/projects/new">
          <Button variant="ghost" size="sm" className="font-mono text-xs">
            + nuevo
          </Button>
        </Link>
      </div>

      {!projects?.length ? (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no tienes proyectos. Crea el primero para empezar a registrar avances.
          </p>
          <Link href="/projects/new" className="mt-4 inline-block">
            <Button variant="ghost" size="sm" className="font-mono text-xs">
              crear proyecto
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.slug}`}
                className="block border border-border p-4 hover:border-accent transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{p.name}</span>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span className="text-accent">
                      {STATUS_LABEL[p.status as ProjectStatus]}
                    </span>
                    <span>{p.entries[0]?.count ?? 0} entradas</span>
                  </span>
                </div>
                {p.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
