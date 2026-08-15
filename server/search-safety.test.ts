import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  createSearchHeaders,
} from "../client/src/aloo/utils/searchEngines";

describe("busca segura", () => {
  it("envia apenas cabeçalhos explícitos, sem identificadores de proxy ou rotação", () => {
    const headers = createSearchHeaders({ "X-Request-Source": "asset-intelligence" });

    expect(headers).toEqual({
      "Content-Type": "application/json",
      "X-Request-Source": "asset-intelligence",
    });
    expect(headers).not.toHaveProperty("X-Gateway-ID");
    expect(headers).not.toHaveProperty("X-Node-Context");
    expect(headers).not.toHaveProperty("X-App-Fingerprint");
  });

  it("mantém as configurações sem fluxo residual de proxy, VPN ou evasão", () => {
    const settingsSource = readFileSync(
      new URL("../client/src/aloo/components/SystemSettingsTab.tsx", import.meta.url),
      "utf8",
    );

    expect(settingsSource).not.toMatch(/proxy_vpn/i);
    expect(settingsSource).not.toMatch(/VPN\/Proxy/i);
    expect(settingsSource).not.toMatch(/Bypass Cloudflare/i);
    expect(settingsSource).not.toMatch(/rota[çc][ãa]o de User-Agent/i);
  });
});
