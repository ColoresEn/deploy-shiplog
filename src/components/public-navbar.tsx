import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function PublicNavbar() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <div className="flex-shrink-0 flex items-center gap-2">
          <Image
            src="/img/pnglogoxs.fw.png"
            alt="Qep"
            width={44}
            height={44}
            priority
            className="w-auto"
          />
          <Link href="/" className="font-mono text-sm tracking-tight">
            fepdev.es
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-mono text-xs">
              entrar
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
