import type { Express } from "express";

export const SEARCH_SOURCE_BLOCKED_CODE = "SEARCH_SOURCE_BLOCKED" as const;
export const SEARCH_PROVIDER_UNAVAILABLE_CODE = "SEARCH_PROVIDER_UNAVAILABLE" as const;

type SearchFailureCode =
  | typeof SEARCH_SOURCE_BLOCKED_CODE
  | typeof SEARCH_PROVIDER_UNAVAILABLE_CODE;

type SearchSource = {
  name: string;
  endpoint: string;
};

type SearchFailure = {
  source: string;
  status?: number;
  reason: string;
};

export type SearchFailurePayload = {
  success: false;
  contacts: [];
  errorCode: SearchFailureCode;
  message: string;
  failures: SearchFailure[];
};

export type SearchSuccessPayload = {
  success: true;
  contacts: [];
  rawContent: string;
  sourceEngine: string;
  enginesCount: number;
};

const PUBLIC_SEARCH_SOURCES: SearchSource[] = [
  { name: "searx.be", endpoint: "https://searx.be/search" },
  { name: "searxng.ononoki.org", endpoint: "https://search.ononoki.org/search" },
];

export function buildSearchSourceUrl(endpoint: string, query: string): string {
  const url = new URL(endpoint);
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  return url.toString();
}

export function getSearchFailurePayload(failures: SearchFailure[]): SearchFailurePayload {
  const sourceBlocked = failures.some(failure => failure.status === 403);

  return {
    success: false,
    contacts: [],
    errorCode: sourceBlocked ? SEARCH_SOURCE_BLOCKED_CODE : SEARCH_PROVIDER_UNAVAILABLE_CODE,
    message: sourceBlocked
      ? "As fontes públicas de busca recusaram a consulta. O loop foi pausado para evitar tentativas repetidas sem resultado."
      : "Nenhuma fonte pública de busca está disponível no momento. O loop foi pausado para evitar tentativas repetidas sem resultado.",
    failures,
  };
}

export function isSearchFailurePayload(value: unknown): value is SearchFailurePayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      "errorCode" in value &&
      ((value as { errorCode?: unknown }).errorCode === SEARCH_SOURCE_BLOCKED_CODE ||
        (value as { errorCode?: unknown }).errorCode === SEARCH_PROVIDER_UNAVAILABLE_CODE),
  );
}

function toRawContent(data: unknown): string {
  if (!data || typeof data !== "object" || !("results" in data) || !Array.isArray((data as { results?: unknown[] }).results)) {
    return "";
  }

  return (data as { results: Array<{ title?: unknown; content?: unknown; url?: unknown }> }).results
    .map(result => [result.title, result.content, result.url].filter(value => typeof value === "string").join("\n"))
    .filter(Boolean)
    .join("\n\n");
}

function isBlockedHtml(content: string): boolean {
  return /verifying your browser|antibot|captcha/i.test(content);
}

export async function runPublicSearch(
  query: string,
  fetcher: typeof fetch = fetch,
  sources: SearchSource[] = PUBLIC_SEARCH_SOURCES,
): Promise<SearchSuccessPayload | SearchFailurePayload> {
  const failures: SearchFailure[] = [];

  for (const source of sources) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetcher(buildSearchSourceUrl(source.endpoint, query), {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        failures.push({ source: source.name, status: response.status, reason: `HTTP ${response.status}` });
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      const rawContent = contentType.includes("application/json")
        ? toRawContent(await response.json())
        : contentType.includes("text/html")
          ? await response.text()
          : "";

      if (contentType.includes("text/html") && isBlockedHtml(rawContent)) {
        failures.push({ source: source.name, status: 403, reason: "Página de bloqueio detectada" });
        continue;
      }

      if (!rawContent) {
        failures.push({ source: source.name, status: response.status, reason: "Resposta sem conteúdo utilizável" });
        continue;
      }

      return {
        success: true,
        contacts: [],
        rawContent,
        sourceEngine: source.name,
        enginesCount: 1,
      };
    } catch (error) {
      failures.push({
        source: source.name,
        reason: error instanceof Error && error.name === "AbortError" ? "Tempo limite" : "Falha de rede",
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return getSearchFailurePayload(failures);
}

export function registerSearchRoute(app: Express) {
  app.post("/api/search", async (req, res) => {
    const query = typeof req.body?.query === "string" ? req.body.query.trim().slice(0, 150) : "";

    if (!query) {
      res.status(400).json({ success: false, contacts: [], errorCode: "INVALID_SEARCH_QUERY", message: "Informe um termo de busca válido." });
      return;
    }

    const payload = await runPublicSearch(query);
    const status = payload.success ? 200 : payload.errorCode === SEARCH_SOURCE_BLOCKED_CODE ? 403 : 503;
    res.status(status).json(payload);
  });
}
