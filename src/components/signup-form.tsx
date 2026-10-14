"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setStatus("idle");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setStatus("idle");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setStatus("idle");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email" className="font-mono text-xs">correo</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password" className="font-mono text-xs">contraseña</Label>
        <Input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={status === "loading"}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword" className="font-mono text-xs">confirmar contraseña</Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={status === "loading"}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={status === "loading"} className="font-mono text-xs">
        {status === "loading" ? "registrando…" : "registrarse"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <a href="/login" className="underline hover:text-foreground">
          inicia sesión
        </a>
      </p>
    </form>
  );
}
