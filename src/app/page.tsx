import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicNavbar } from "@/components/public-navbar";
import { Footer } from "@/components/footer";

export default function LandingPage() {
  return (
    <>
      <PublicNavbar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Registra lo que construyes
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Una bitácora de desarrollo para documentar tus proyectos, semana a semana.
              Mantén un registro de tus avances y celebra tu progreso.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="font-mono text-sm">
                  empezar ahora
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="ghost" size="lg" className="font-mono text-sm">
                  crear cuenta
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-3">
            <div className="border border-border bg-card p-6">
              <h3 className="font-semibold mb-2">Proyectos</h3>
              <p className="text-sm text-muted-foreground">
                Organiza tus proyectos de desarrollo en un solo lugar, con descripciones y estados.
              </p>
            </div>
            <div className="border border-border bg-card p-6">
              <h3 className="font-semibold mb-2">Entradas semanales</h3>
              <p className="text-sm text-muted-foreground">
                Registra tus avances cada semana con notas y reflexiones sobre tu progreso.
              </p>
            </div>
            <div className="border border-border bg-card p-6">
              <h3 className="font-semibold mb-2">Historial</h3>
              <p className="text-sm text-muted-foreground">
                Revisa tu timeline de desarrollo y ve cómo has evolucionado con el tiempo.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
