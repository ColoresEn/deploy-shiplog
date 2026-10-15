import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/project-form";
import { deleteProject, updateProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";

export default async function EditProjectPage({
  params,
}: PageProps<"/projects/[slug]/edit">) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!project) notFound();

  return (
    <>
      <h1 className="font-mono text-sm">editar proyecto</h1>
      <div className="mt-6">
        <ProjectForm action={updateProject} project={project} />
      </div>
      <div className="mt-8 border border-destructive/20 p-4 ring-destructive/20">
        <form action={deleteProject} className="flex w-full items-center justify-between gap-4">
          <input type="hidden" name="id" value={project.id} />
          <p className="text-sm text-muted-foreground">
            Eliminar el proyecto borra también todas sus entradas.
          </p>
          <Button type="submit" variant="destructive" className="font-mono text-xs">
            eliminar proyecto
          </Button>
        </form>
      </div>
    </>
  );
}
