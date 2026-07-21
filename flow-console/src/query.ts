export const scenarioIds = [
  "normal-bid",
  "concurrent-bid",
  "auto-extension",
  "websocket-recovery",
  "duplicate-finish",
  "deal-retry",
] as const;

export type ScenarioId = (typeof scenarioIds)[number];
export const defaultScenarioId: ScenarioId = "normal-bid";

export function isScenarioId(value: string | null): value is ScenarioId {
  return value !== null && scenarioIds.includes(value as ScenarioId);
}

export function readScenario(search: string): ScenarioId {
  const value = new URLSearchParams(search).get("scenario");
  return isScenarioId(value) ? value : defaultScenarioId;
}

export function updateScenarioUrl(url: URL, scenarioId: ScenarioId): URL {
  const next = new URL(url);
  next.searchParams.set("scenario", scenarioId);
  return next;
}
