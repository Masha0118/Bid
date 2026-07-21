import { describe, expect, it } from "vitest";
import { defaultScenarioId, readScenario, updateScenarioUrl } from "../src/query";

describe("scenario query parameter", () => {
  it("selects a valid deep link", () => {
    expect(readScenario("?scenario=concurrent-bid")).toBe("concurrent-bid");
  });

  it("falls back for missing or invalid values", () => {
    expect(readScenario("")).toBe(defaultScenarioId);
    expect(readScenario("?scenario=unknown")).toBe(defaultScenarioId);
  });

  it("updates only the scenario while preserving a Pages subpath and other query values", () => {
    const url = new URL("https://example.test/Bid/?view=compact#flow");
    const next = updateScenarioUrl(url, "websocket-recovery");
    expect(next.pathname).toBe("/Bid/");
    expect(next.searchParams.get("view")).toBe("compact");
    expect(next.searchParams.get("scenario")).toBe("websocket-recovery");
    expect(next.hash).toBe("#flow");
  });
});
