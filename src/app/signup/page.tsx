import type { Metadata } from "next";
import { SignupForm } from "@/components/signup-form";
import { PublicNavbar } from "@/components/public-navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = { title: "Registrarse" };

export default function SignupPage() {
  return (
    <>
      <PublicNavbar />
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-mono text-xl">fepdev.es</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea tu cuenta para empezar a registrar tus proyectos.
          </p>
          <div className="mt-6 border border-border p-4">
            <SignupForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
