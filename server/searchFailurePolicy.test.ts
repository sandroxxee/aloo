import { describe, expect, it } from "vitest";
import { getLoopPausePatch, getSearchFailurePausePolicy, resolveClientSearchFailureTransition, shouldScheduleNextLoopBatch } from "../client/src/aloo/utils/searchFailurePolicy";

describe("search failure pause policy", () => {
  it("pauses on a classified blocked source", () => {
    expect(getSearchFailurePausePolicy({ status: 403, contentType: "application/json", errorCode: "SEARCH_SOURCE_BLOCKED" }))
      .toEqual({ reason: "A fonte externa de busca não está disponível." });
  });

  it("pauses before another batch when the endpoint is missing or returns HTML", () => {
    expect(getSearchFailurePausePolicy({ status: 404, contentType: "text/html" }))
      .toEqual({ reason: "O endpoint de busca não está disponível." });
    expect(getSearchFailurePausePolicy({ status: 200, contentType: "text/html" }))
      .toEqual({ reason: "O endpoint de busca retornou um formato inesperado." });
  });

  it("does not pause a valid JSON response", () => {
    expect(getSearchFailurePausePolicy({ status: 200, contentType: "application/json" })).toBeNull();
  });

  it("does not schedule another batch after a classified failure pauses the loop", () => {
    expect(shouldScheduleNextLoopBatch({ isSubscribed: true, searchUnavailable: true, loopStatus: "paused_manual" })).toBe(false);
    expect(shouldScheduleNextLoopBatch({ isSubscribed: true, searchUnavailable: false, loopStatus: "running" })).toBe(true);
  });

  it("produces the real loop pause transition with a readable reason for 403, 404 and HTML failures", () => {
    const scenarios = [
      { status: 403, contentType: "application/json", errorCode: "SEARCH_SOURCE_BLOCKED" },
      { status: 404, contentType: "text/html" },
      { status: 200, contentType: "text/html" },
    ];

    scenarios.forEach(scenario => {
      const policy = getSearchFailurePausePolicy(scenario);
      expect(policy).not.toBeNull();
      const transition = getLoopPausePatch(policy!.reason);
      expect(transition).toMatchObject({
        status: "paused_manual",
        activeBatch: [],
        backoffActive: false,
        manualRequiredReason: expect.any(String),
      });
      expect(shouldScheduleNextLoopBatch({ isSubscribed: true, searchUnavailable: true, loopStatus: transition.status })).toBe(false);
    });
  });

  it("exercises the client-equivalent failure flow without scheduling another batch", () => {
    const scenarios = [
      { status: 403, contentType: "application/json", errorCode: "SEARCH_SOURCE_BLOCKED" },
      { status: 404, contentType: "text/html" },
      { status: 200, contentType: "text/html" },
    ];

    scenarios.forEach(scenario => {
      const transition = resolveClientSearchFailureTransition({ ...scenario, queryTerm: "caminhão teste" });
      expect(transition).toMatchObject({
        loopPatch: { status: "paused_manual", activeBatch: [], backoffActive: false },
        logMessage: expect.stringContaining("caminhão teste"),
        shouldScheduleNextBatch: false,
      });
    });

    expect(resolveClientSearchFailureTransition({ status: 200, contentType: "application/json", queryTerm: "caminhão teste" })).toBeNull();
  });
});
