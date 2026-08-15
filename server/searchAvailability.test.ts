import { describe, expect, it } from "vitest";
import {
  SEARCH_SOURCE_BLOCKED_CODE,
  SEARCH_PROVIDER_UNAVAILABLE_CODE,
  buildSearchSourceUrl,
  getSearchFailurePayload,
  runPublicSearch,
} from "./searchAvailability";

describe("search availability", () => {
  it("classifica bloqueios 403 por origem sem confundir com indisponibilidade geral", () => {
    const payload = getSearchFailurePayload([
      { source: "fonte-a", status: 403, reason: "HTTP 403" },
      { source: "fonte-b", status: 403, reason: "HTTP 403" },
    ]);

    expect(payload.errorCode).toBe(SEARCH_SOURCE_BLOCKED_CODE);
    expect(payload.message).toContain("loop foi pausado");
  });

  it("mantém o bloqueio identificado quando outra fonte também está limitada", () => {
    const payload = getSearchFailurePayload([
      { source: "fonte-a", status: 403, reason: "Página de bloqueio detectada" },
      { source: "fonte-b", status: 429, reason: "HTTP 429" },
    ]);

    expect(payload.errorCode).toBe(SEARCH_SOURCE_BLOCKED_CODE);
  });

  it("mantém uma resposta válida processável quando uma fonte pública devolve JSON", async () => {
    const payload = await runPublicSearch(
      "caminhão usado",
      async () => new Response(
        JSON.stringify({ results: [{ title: "Anúncio", content: "Contato comercial", url: "https://example.com/anuncio" }] }),
        { headers: { "content-type": "application/json" } },
      ),
      [{ name: "teste", endpoint: "https://example.test/search" }],
    );

    expect(payload).toMatchObject({ success: true, sourceEngine: "teste" });
    expect("rawContent" in payload && payload.rawContent).toContain("Contato comercial");
  });

  it("mantém uma resposta HTML legítima processável para extração local", async () => {
    const payload = await runPublicSearch(
      "caminhão usado",
      async () => new Response("<html><body>Contato comercial (11) 99999-9999</body></html>", {
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
      [{ name: "teste", endpoint: "https://example.test/search" }],
    );

    expect(payload).toMatchObject({ success: true, sourceEngine: "teste" });
    expect("rawContent" in payload && payload.rawContent).toContain("99999-9999");
  });

  it("classifica uma página anti-bot como fonte bloqueada sem tentar contorná-la", async () => {
    const payload = await runPublicSearch(
      "caminhão usado",
      async () => new Response("<html><title>Verifying your browser</title><a href='/antibot/captcha'>captcha</a></html>", {
        headers: { "content-type": "text/html" },
      }),
      [{ name: "teste", endpoint: "https://example.test/search" }],
    );

    expect(payload).toMatchObject({ success: false, errorCode: SEARCH_SOURCE_BLOCKED_CODE });
  });

  it("classifica uma fonte inacessível sem usar proxy", async () => {
    const payload = await runPublicSearch(
      "caminhão usado",
      async () => new Response("bloqueado", { status: 403 }),
      [{ name: "teste", endpoint: "https://example.test/search" }],
    );

    expect(payload).toMatchObject({ success: false, errorCode: SEARCH_SOURCE_BLOCKED_CODE });
    expect(buildSearchSourceUrl("https://example.test/search", "caminhão usado")).toContain("format=json");
  });

  it("mantém a indisponibilidade geral distinta de uma recusa 403", () => {
    const payload = getSearchFailurePayload([{ source: "teste", status: 502, reason: "HTTP 502" }]);
    expect(payload.errorCode).toBe(SEARCH_PROVIDER_UNAVAILABLE_CODE);
  });
});
