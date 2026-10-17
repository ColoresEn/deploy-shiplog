"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EntryKind } from "@/lib/constants";

export type GitHubSuggestion = {
  id: string;
  source: "commit" | "pull_request";
  title: string;
  body: string;
  kind: EntryKind;
  shippedAt: string;
  url: string;
};

type SuggestionResult =
  | { suggestions: GitHubSuggestion[] }
  | { error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseGitHubRepo(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(repoUrl);
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
    if (
      parts.length !== 2 ||
      !/^[\w.-]+$/.test(parts[0]) ||
      parts[0] === "." ||
      parts[0] === ".."
    ) {
      return null;
    }
    const repo = parts[1].replace(/\.git$/, "");
    if (!/^[\w.-]+$/.test(repo) || repo === "." || repo === "..") return null;
    return { owner: parts[0], repo };
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

function normalizeTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

async function fetchGitHubList(url: string): Promise<unknown[]> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "ShipLog",
    },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("No se encontró el repo o es privado. Esta integración admite repositorios públicos.");
    }
    if (response.status === 403) {
      throw new Error("GitHub limitó las consultas. Inténtalo de nuevo más tarde.");
    }
    throw new Error(`GitHub respondió con el estado ${response.status}.`);
  }

  const result: unknown = await response.json();
  if (!Array.isArray(result)) throw new Error("GitHub devolvió una respuesta inesperada.");
  return result;
}

function makeSuggestion(
  source: GitHubSuggestion["source"],
  id: string,
  title: string,
  description: string,
  date: string,
  url: string,
): GitHubSuggestion | null {
  const shippedAt = new Date(date);
  const cleanTitle = title.trim().split("\n")[0].slice(0, 140);
  if (!cleanTitle || !Number.isFinite(shippedAt.getTime()) || !url.startsWith("https://github.com/")) {
    return null;
  }

  const detail = description.trim().slice(0, 3000);
  const sourceLabel = source === "pull_request" ? "PR mergeado" : "Commit";
  return {
    id,
    source,
    title: cleanTitle,
    body: `${detail ? `${detail}\n\n` : ""}Origen: [${sourceLabel}](${url})`,
    kind: classify(cleanTitle),
    shippedAt: shippedAt.toISOString().slice(0, 10),
    url,
  };
}

function parsePullRequest(value: unknown): GitHubSuggestion | null {
  if (!isRecord(value)) return null;
  const { number, title, body, merged_at: mergedAt, html_url: htmlUrl } = value;
  if (
    typeof number !== "number" ||
    typeof title !== "string" ||
    typeof mergedAt !== "string" ||
    typeof htmlUrl !== "string"
  ) {
    return null;
  }
  return makeSuggestion(
    "pull_request",
    `pr-${number}`,
    title,
    typeof body === "string" ? body : "",
    mergedAt,
    htmlUrl,
  );
}

function parseCommit(value: unknown): GitHubSuggestion | null {
  if (!isRecord(value) || !isRecord(value.commit)) return null;
  const commit = value.commit;
  const author = isRecord(commit.author) ? commit.author : null;
  const committer = isRecord(commit.committer) ? commit.committer : null;
  const { sha, html_url: htmlUrl } = value;
  const { message } = commit;
  const date = author?.date ?? committer?.date;
  if (
    typeof sha !== "string" ||
    typeof htmlUrl !== "string" ||
    typeof message !== "string" ||
    typeof date !== "string" ||
    /^merge\b|^merge pull request\b/i.test(message.trim())
  ) {
    return null;
  }

  const [title, ...description] = message.split("\n");
  return makeSuggestion("commit", sha, title, description.join("\n").trim(), date, htmlUrl);
}

export async function getGitHubSuggestions(projectId: string): Promise<SuggestionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project, error } = await supabase
    .from("projects")
    .select("repo_url")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return { error: "No se pudo cargar el proyecto." };
  if (!project) return { error: "No se encontró el proyecto." };
  if (!project.repo_url) return { error: "Añade la URL del repo en la edición del proyecto." };

  const repo = parseGitHubRepo(project.repo_url);
  if (!repo) return { error: "La URL debe ser un repositorio público de github.com." };

  const baseUrl = `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`;
  try {
    const [pullRequests, commits] = await Promise.all([
      fetchGitHubList(`${baseUrl}/pulls?state=closed&sort=updated&direction=desc&per_page=50`),
      fetchGitHubList(`${baseUrl}/commits?per_page=50`),
    ]);

    const candidates = [
      ...pullRequests.map(parsePullRequest).filter((item): item is GitHubSuggestion => item !== null),
      ...commits.map(parseCommit).filter((item): item is GitHubSuggestion => item !== null),
    ];
    const seenTitles = new Set<string>();
    const suggestions = candidates
      .filter((item) => {
        const key = normalizeTitle(item.title);
        if (!key || seenTitles.has(key)) return false;
        seenTitles.add(key);
        return true;
      })
      .sort((a, b) => b.shippedAt.localeCompare(a.shippedAt))
      .slice(0, 30);

    return { suggestions };
  } catch (fetchError) {
    return {
      error: fetchError instanceof Error
        ? fetchError.message
        : "No se pudieron obtener los cambios de GitHub.",
    };
  }
}
