import Link from "next/link";
import { KIND_LABEL, type EntryKind } from "@/lib/constants";
import { groupByWeek, weekLabel } from "@/lib/week";
import { deleteEntry } from "@/app/actions/entries";
import type { Tables } from "@/lib/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const dayFmt = new Intl.DateTimeFormat("es", {
  weekday: "short",
  day: "numeric",
  timeZone: "UTC",
});

const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 4,
});

const KIND_BADGE_CLASS: Record<EntryKind, string> = {
  feature: "text-success",
  bugfix: "text-destructive",
  refactor: "text-accent",
  other: "text-muted-foreground",
};

function costBadge(e: Tables<"entries">) {
  const parts: string[] = [];
  if (e.tokens > 0) parts.push(`${e.tokens.toLocaleString()} tokens`);
  if (e.cost_usd > 0) parts.push(usdFmt.format(e.cost_usd));
  if (!parts.length) return null;
  return (
    <span className="text-xs text-warning">
      {parts.join(" · ")}
    </span>
  );
}

export function Timeline({ entries, slug }: { entries: Tables<"entries">[]; slug: string }) {
  if (!entries.length) {
    return (
      <div className="text-sm text-muted-foreground py-8">
        Todavía no hay entradas. Registra tu primer avance arriba.
      </div>
    );
  }

  return (
    <div className="relative border-l border-border pl-6">
      {groupByWeek(entries).map((group, groupIndex) => (
        <section key={group.key} className="relative pb-8 last:pb-0">
          <div className="absolute -left-[23px] top-0 size-2 bg-accent" />
          <h2 className="mb-4 font-mono text-sm text-warning">
            {weekLabel(group.week)}
          </h2>
          <div className="space-y-4">
            {group.items.map((e, entryIndex) => (
              <div key={e.id} className="relative">
                <div className="absolute -left-[23px] top-1.5 size-1.5 bg-border" />
                <div className="pb-4 last:pb-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      {dayFmt.format(new Date(`${e.shipped_at}T00:00:00Z`))}
                    </span>
                    <span className={KIND_BADGE_CLASS[e.kind as EntryKind]}>
                      {KIND_LABEL[e.kind as EntryKind]}
                    </span>
                    <span className="font-medium">{e.title}</span>
                    {costBadge(e)}
                  </div>
                  {e.body ? (
                    <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{e.body}</p>
                  ) : null}
                  {e.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {e.tags.map((t) => (
                        <span key={t} className="text-xs text-muted-foreground font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-2 flex gap-4 text-xs">
                    <Link href={`/projects/${slug}/entries/${e.id}`} className="text-muted-foreground hover:text-foreground">
                      Editar
                    </Link>
                    <form action={deleteEntry}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <button type="submit" className="text-destructive hover:text-destructive/80">
                        Borrar
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
