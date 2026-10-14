import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-mono text-sm tracking-tight">
            bitácora.dev
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted-foreground font-mono sm:inline">{user.email}</span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm" className="font-mono text-xs">
                salir
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
      <Footer />
    </>
  );
}
