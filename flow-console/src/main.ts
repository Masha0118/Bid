import "./style.css";
import { getScenario, scenarios, type Scenario } from "./scenarios";
import { readScenario, updateScenarioUrl, type ScenarioId } from "./query";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Flow Console root element is missing.");

let selectedId = readScenario(window.location.search);
let visibleStep = 0;
let timer: number | undefined;

function stateGrid(title: string, state: Record<string, string>, changed: boolean): string {
  return `<section class="state-card ${changed ? "after" : ""}">
    <span class="eyebrow">${title}</span>
    <dl>${Object.entries(state).map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join("")}</dl>
  </section>`;
}

function renderScenario(scenario: Scenario): void {
  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="${import.meta.env.BASE_URL}" aria-label="Flow Console 처음으로">
        <span class="brand-mark">B</span><span><b>BID ON</b><small>FLOW CONSOLE</small></span>
      </a>
      <div class="status"><i></i> STATIC PLAYBACK <span>실서버 미연결</span></div>
    </header>
    <main>
      <section class="hero">
        <div><span class="eyebrow">BACKEND DECISION VISUALIZER</span><h1>실시간 경매의<br><em>결정 순간</em>을 펼쳐봅니다.</h1></div>
        <p>운영 화면과 소스코드를 공개하지 않고, 문서에서 확인한 처리 순서를 가상 데이터로 재구성했습니다.</p>
      </section>
      <div class="console-grid">
        <aside class="scenario-nav" aria-label="시나리오 선택">
          <div class="panel-title"><span>SCENARIOS</span><b>06</b></div>
          ${scenarios.map((item, index) => `<button data-scenario="${item.id}" class="scenario-button ${item.id === scenario.id ? "active" : ""}"><span>0${index + 1}</span><b>${item.title}</b><small>${item.result}</small></button>`).join("")}
        </aside>
        <section class="workspace">
          <div class="workspace-head">
            <div><span class="eyebrow">SELECTED SCENARIO</span><h2>${scenario.title}</h2><p>${scenario.summary}</p></div>
            <button id="play" class="play-button"><span>▶</span> 흐름 재생</button>
          </div>
          <div class="flow-track">
            ${scenario.steps.map((step, index) => `<article class="flow-step ${index <= visibleStep ? "visible" : ""}" data-step="${index}">
              <div class="step-index">${String(index + 1).padStart(2, "0")}</div>
              <div class="step-body"><span class="actor ${step.kind}">${step.actor}</span><h3>${step.title}</h3><p>${step.detail}</p></div>
            </article>`).join("")}
          </div>
          <div class="result-strip"><span>FINAL STATE</span><strong>${scenario.result}</strong><b>VERIFIED FLOW <i>✓</i></b></div>
        </section>
      </div>
      <section class="lower-grid">
        <div class="state-compare">${stateGrid("BEFORE", scenario.before, false)}<div class="arrow">→</div>${stateGrid("AFTER", scenario.after, true)}</div>
        <aside class="evidence-card">
          <div class="panel-title"><span>IMPLEMENTATION EVIDENCE</span></div>
          <ul>${scenario.evidence.map((item, index) => `<li class="${index === 3 ? "caution" : ""}"><i>${index === 3 ? "!" : "✓"}</i>${item}</li>`).join("")}</ul>
          <a href="${scenario.documentUrl}" target="_blank" rel="noreferrer">관련 기술 문서 열기 <span>↗</span></a>
        </aside>
      </section>
      <p class="disclaimer">실제 운영 모니터링 화면이나 Flutter 앱 UI가 아닙니다. 비공개 원본 프로젝트의 처리 구조를 공개 가능한 가상 데이터로 재구성한 기술 시연 화면입니다.</p>
    </main>`;

  bindEvents();
}

function selectScenario(id: ScenarioId, pushHistory = true): void {
  window.clearInterval(timer);
  selectedId = id;
  visibleStep = 0;
  if (pushHistory) {
    const next = updateScenarioUrl(new URL(window.location.href), id);
    window.history.pushState({ scenario: id }, "", `${next.pathname}${next.search}${next.hash}`);
  }
  renderScenario(getScenario(id));
}

function play(): void {
  window.clearInterval(timer);
  visibleStep = -1;
  const scenario = getScenario(selectedId);
  renderScenario(scenario);
  timer = window.setInterval(() => {
    visibleStep += 1;
    document.querySelector(`[data-step="${visibleStep}"]`)?.classList.add("visible");
    if (visibleStep >= scenario.steps.length - 1) window.clearInterval(timer);
  }, 520);
}

function bindEvents(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => selectScenario(button.dataset.scenario as ScenarioId));
  });
  document.querySelector<HTMLButtonElement>("#play")?.addEventListener("click", play);
}

window.addEventListener("popstate", () => selectScenario(readScenario(window.location.search), false));
renderScenario(getScenario(selectedId));
