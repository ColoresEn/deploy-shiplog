import type { Metadata } from "next";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = { title: "Registrarse" };

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="font-mono text-xl">bitácora.dev</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registra lo que construyes, semana a semana.
        </p>
        <div className="mt-6 border border-border p-4">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
