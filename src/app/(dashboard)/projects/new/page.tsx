import type { Metadata } from "next";
import { ProjectForm } from "@/components/project-form";
import { createProject } from "@/app/actions/projects";

export const metadata: Metadata = { title: "Nuevo proyecto" };

export default function NewProjectPage() {
  return (
    <>
      <h1 className="font-mono text-sm">nuevo proyecto</h1>
      <div className="mt-6">
        <ProjectForm action={createProject} />
      </div>
    </>
  );
}
