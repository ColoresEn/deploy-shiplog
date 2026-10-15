import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground font-mono">
            © {new Date().getFullYear()} fepdev.es
          </p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
