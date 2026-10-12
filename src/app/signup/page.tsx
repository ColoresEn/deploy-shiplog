import type { Metadata } from "next";
import { SignupForm } from "@/components/signup-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Registrarse" };

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">ShipLog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registra lo que construyes, semana a semana.
        </p>
        <Card className="mt-6 p-4 ring-black">
          <SignupForm />
        </Card>
      </div>
    </main>
  );
}
