import type { Metadata } from "next";
import { MagicLinkForm } from "@/components/magic-link-form";
import { PublicNavbar } from "@/components/public-navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, next } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/projects";

  return (
    <>
      <PublicNavbar />
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-mono text-xl">fepdev.es</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Registra lo que construyes, semana a semana.
          </p>
          <div className="mt-6 border border-border p-4">
            {typeof error === "string" ? (
              <p className="mb-4 border border-destructive/20 p-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <MagicLinkForm next={nextPath} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
