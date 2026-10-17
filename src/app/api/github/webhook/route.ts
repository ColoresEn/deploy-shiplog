import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { EntryKind } from "@/lib/constants";

export const runtime = "nodejs";

type GitHubRepo = { owner: string; name: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRepoName(value: unknown): GitHubRepo | null {
  if (typeof value !== "string") return null;
  const [owner, name, ...rest] = value.split("/");
  if (
    rest.length ||
    !owner ||
    !name ||
    !/^[\w.-]+$/.test(owner) ||
    !/^[\w.-]+$/.test(name) ||
    owner === "." ||
    owner === ".." ||
    name === "." ||
    name === ".."
  ) {
    return null;
  }
  return { owner, name };
}

function parseRepoUrl(value: string | null): GitHubRepo | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "github.com" ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 2) return null;
    return parseRepoName(`${parts[0]}/${parts[1].replace(/\.git$/, "")}`);
  } catch {
    return null;
  }
}

function classify(title: string): EntryKind {
  if (/\b(fix|bugfix|bug|hotfix|patch|arregl|corrig)/i.test(title)) return "bugfix";
  if (/\b(refactor|rework|cleanup|clean up|reorganiz|restructur)/i.test(title)) return "refactor";
  if (/\b(feat|feature|add|implement|create|support|introduc|agreg|añad|crear|implementar)/i.test(title)) {
    return "feature";
  }
  return "other";
}

function isValidSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !/^sha256=[\da-f]{64}$/i.test(signature)) return false;
  const actual = Buffer.from(signature.slice("sha256=".length), "hex");
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function reply(status: number, message: string) {
  return Response.json({ message }, { status });
}

async function readPayload(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks).toString("utf8");
}

export async function POST(request: Request) {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!webhookSecret || !supabaseUrl || !supabaseKey) {
    console.error("GitHub webhook configuration is incomplete.");
    return reply(500, "Webhook no configurado.");
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1_000_000) return reply(413, "Payload demasiado grande.");

  const rawBody = await readPayload(request, 1_000_000);
  if (rawBody === null) return reply(413, "Payload demasiado grande.");
  if (!isValidSignature(rawBody, request.headers.get("x-hub-signature-256"), webhookSecret)) {
    return reply(401, "Firma de GitHub inválida.");
  }

  const event = request.headers.get("x-github-event");
  if (event !== "pull_request") return reply(202, "Evento ignorado.");

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return reply(400, "Payload JSON inválido.");
  }
  if (!isRecord(payload) || !isRecord(payload.repository) || !isRecord(payload.pull_request)) {
    return reply(400, "Payload de pull request inválido.");
  }

  const repository = parseRepoName(payload.repository.full_name);
  const pullRequest = payload.pull_request;
  if (
    payload.action !== "closed" ||
    typeof pullRequest.merged_at !== "string" ||
    !repository
  ) {
    return reply(202, "Solo se procesan pull requests mergeados.");
  }

  const mergedAt = new Date(pullRequest.merged_at);
  const number = pullRequest.number;
  const title = typeof pullRequest.title === "string" ? pullRequest.title.trim() : "";
  const htmlUrl = typeof pullRequest.html_url === "string" ? pullRequest.html_url : "";
  if (
    !Number.isInteger(number) ||
    !title ||
    !Number.isFinite(mergedAt.getTime()) ||
    !htmlUrl.startsWith(`https://github.com/${repository.owner}/${repository.name}/pull/`)
  ) {
    return reply(400, "Datos del pull request inválidos.");
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id, slug, repo_url")
    .not("repo_url", "is", null);
  if (projectError) {
    console.error("Could not load projects for GitHub webhook.", projectError);
    return reply(500, "No se pudieron buscar proyectos vinculados.");
  }

  const matchingProjects = projects.filter((project) => {
    const projectRepo = parseRepoUrl(project.repo_url);
    return projectRepo?.owner.toLowerCase() === repository.owner.toLowerCase() &&
      projectRepo.name.toLowerCase() === repository.name.toLowerCase();
  });
  if (!matchingProjects.length) return reply(202, "No hay proyectos vinculados a este repositorio.");

  const description = typeof pullRequest.body === "string" ? pullRequest.body.trim().slice(0, 3000) : "";
  const sourceUrl = `https://github.com/${repository.owner}/${repository.name}/pull/${number}`;
  const entryTitle = title.slice(0, 140);
  const { error: insertError } = await supabase.from("entries").upsert(
    matchingProjects.map((project) => ({
      project_id: project.id,
      user_id: project.user_id,
      title: entryTitle,
      body: `${description ? `${description}\n\n` : ""}Origen: [PR mergeado](${sourceUrl})`,
      kind: classify(entryTitle),
      tags: ["github", "pull-request"],
      shipped_at: mergedAt.toISOString().slice(0, 10),
      github_pr_url: sourceUrl,
    })),
    { onConflict: "project_id,github_pr_url", ignoreDuplicates: true },
  );
  if (insertError) {
    console.error("Could not create entries for merged GitHub pull request.", insertError);
    return reply(500, "No se pudieron crear las entradas.");
  }

  for (const project of matchingProjects) {
    revalidatePath(`/projects/${project.slug}`);
  }
  return reply(200, "Pull request procesado.");
}
