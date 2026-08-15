import { describe, expect, it } from "vitest";
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
});
