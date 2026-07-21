import type { ScenarioId } from "./query";

export type Scenario = {
  id: ScenarioId;
  title: string;
  summary: string;
  result: string;
  documentUrl: string;
  evidence: string[];
  before: Record<string, string>;
  after: Record<string, string>;
  steps: Array<{ actor: string; title: string; detail: string; kind: "request" | "atomic" | "followup" | "recovery" }>;
};

const docsRoot = "https://github.com/Masha0118/Bid/blob/main/docs";

export const scenarios: Scenario[] = [
  {
    id: "normal-bid",
    title: "정상 입찰",
    summary: "유효한 입찰 한 건이 Redis Lua 판정을 거쳐 상태를 바꾸고 후속 전달로 이어지는 흐름입니다.",
    result: "입찰 승인 · 변경 정보 후속 전달",
    documentUrl: `${docsRoot}/04-%EB%8F%99%EC%8B%9C-%EC%9E%85%EC%B0%B0-%EC%B2%98%EB%A6%AC.md`,
    evidence: ["코드에서 구현 확인", "테스트 코드 확인", "흐름 재구성", "추가 검증 필요"],
    before: { 현재가: "10,000원", 최고입찰자: "없음", 입찰횟수: "0", Version: "41" },
    after: { 현재가: "12,000원", 최고입찰자: "User A", 입찰횟수: "1", Version: "42" },
    steps: [
      { actor: "User A", title: "12,000원 입찰 요청", detail: "공개용 가상 사용자의 유효한 요청", kind: "request" },
      { actor: "Redis Lua", title: "조건 확인과 상태 변경", detail: "시간·최소가를 확인하고 최고가·입찰자·횟수·Version을 한 번에 변경", kind: "atomic" },
      { actor: "Auction Server", title: "결과 반환", detail: "원자 처리 결과를 기준으로 사용자 응답 구성", kind: "followup" },
      { actor: "WebSocket · Kafka", title: "후속 전달", detail: "Lua 실행 이후 변경 정보 전파와 감사 이벤트 발행", kind: "followup" },
    ],
  },
  {
    id: "concurrent-bid",
    title: "두 사용자의 동시 입찰",
    summary: "같은 이전 상태를 본 두 요청을 Redis가 순서대로 판정해 하나의 최종 상태로 수렴시키는 흐름입니다.",
    result: "User B 최고 입찰 · Version 연속 증가",
    documentUrl: `${docsRoot}/04-%EB%8F%99%EC%8B%9C-%EC%9E%85%EC%B0%B0-%EC%B2%98%EB%A6%AC.md`,
    evidence: ["코드에서 구현 확인", "테스트 코드 확인", "흐름 재구성", "추가 검증 필요"],
    before: { 현재가: "10,000원", 최고입찰자: "없음", 입찰횟수: "0", Version: "41" },
    after: { 현재가: "13,000원", 최고입찰자: "User B", 입찰횟수: "2", Version: "43" },
    steps: [
      { actor: "User A · User B", title: "12,000원 · 13,000원 동시 요청", detail: "두 요청이 같은 현재가를 본 상태에서 도착", kind: "request" },
      { actor: "Redis Lua", title: "User A 요청 원자 처리", detail: "Version 41을 기준으로 검증 후 42로 변경", kind: "atomic" },
      { actor: "Redis Lua", title: "User B 요청 재판정", detail: "이미 바뀐 현재가를 기준으로 다시 검증 후 Version 43으로 변경", kind: "atomic" },
      { actor: "WebSocket · Kafka", title: "확정된 결과 후속 처리", detail: "원자 처리 밖에서 변경 정보와 감사 이벤트 전달", kind: "followup" },
    ],
  },
  {
    id: "auto-extension",
    title: "마감 직전 자동 연장",
    summary: "마감 임박 입찰이 종료 시각 변경 조건을 만족하면 가격과 종료 시각, Version을 함께 바꾸는 흐름입니다.",
    result: "종료 시각 연장 · Version 증가",
    documentUrl: `${docsRoot}/04-%EB%8F%99%EC%8B%9C-%EC%9E%85%EC%B0%B0-%EC%B2%98%EB%A6%AC.md`,
    evidence: ["코드에서 구현 확인", "테스트 코드 확인", "흐름 재구성", "추가 검증 필요"],
    before: { 현재가: "42,000원", 남은시간: "00:00:18", 연장횟수: "0", Version: "87" },
    after: { 현재가: "44,000원", 남은시간: "정책 시간으로 연장", 연장횟수: "1", Version: "88" },
    steps: [
      { actor: "User A", title: "마감 임박 입찰", detail: "종료 직전 유효한 금액 요청", kind: "request" },
      { actor: "Redis Lua", title: "연장 조건 확인", detail: "입찰 규칙과 종료 시각 변경 여부를 같은 실행에서 판정", kind: "atomic" },
      { actor: "Redis Lua", title: "가격·종료 시각·Version 변경", detail: "관련 런타임 상태를 함께 반영", kind: "atomic" },
      { actor: "WebSocket", title: "변경 정보 전달", detail: "새 가격과 종료 시각을 후속 전파", kind: "followup" },
    ],
  },
  {
    id: "websocket-recovery",
    title: "이벤트 누락과 상태 복구",
    summary: "수신 Version이 하나 이상 건너뛴 경우 부분 반영을 멈추고 전체 상태를 다시 조회하는 판단 흐름입니다.",
    result: "누락 감지 · 전체 상태 재조회 요청",
    documentUrl: `${docsRoot}/05-%EC%8B%A4%EC%8B%9C%EA%B0%84-%EC%83%81%ED%83%9C-%EB%8F%99%EA%B8%B0%ED%99%94.md`,
    evidence: ["코드에서 구현 확인", "테스트 코드 확인", "흐름 재구성", "추가 검증 필요"],
    before: { 화면Version: "42", 수신Version: "45", 현재가: "12,000원", 연결상태: "재연결" },
    after: { 화면Version: "45", 처리방식: "전체 상태 재조회", 현재가: "16,000원", 연결상태: "동기화" },
    steps: [
      { actor: "WebSocket", title: "Version 45 이벤트 수신", detail: "화면이 기억한 42보다 중간 Version이 비어 있음", kind: "request" },
      { actor: "Client", title: "누락 판정", detail: "바뀐 값만 적용하지 않고 전체 재조회 선택", kind: "recovery" },
      { actor: "Main API", title: "전체 상태 응답", detail: "현재 경매 상태와 최신 Version 반환", kind: "recovery" },
      { actor: "Client", title: "Version 45로 동기화", detail: "더 오래된 응답은 무시하고 최신 상태 반영", kind: "recovery" },
    ],
  },
  {
    id: "duplicate-finish",
    title: "경매 종료 중복 요청 차단",
    summary: "경매별 잠금과 기존 종료 결과 확인으로 반복된 종료 요청이 중복 거래를 만들지 않게 하는 흐름입니다.",
    result: "기존 종료 결과 사용 · 거래 중복 방지",
    documentUrl: `${docsRoot}/06-%EA%B2%BD%EB%A7%A4-%EC%A2%85%EB%A3%8C%EC%99%80-%EB%B3%B5%EA%B5%AC.md`,
    evidence: ["코드에서 구현 확인", "테스트 코드 확인", "흐름 재구성", "추가 검증 필요"],
    before: { 종료요청: "2건", 잠금: "미획득", 완료결과: "확인 전", 거래: "0건" },
    after: { 종료요청: "처리 수렴", 잠금: "경매별 1건", 완료결과: "재사용", 거래: "1건" },
    steps: [
      { actor: "Scheduler · Recovery", title: "같은 경매 종료 요청", detail: "예약 전달과 만료 재탐색이 겹친 상황", kind: "request" },
      { actor: "Auction Server", title: "경매별 잠금 획득", detail: "한 종료 작업만 다음 단계로 진행", kind: "atomic" },
      { actor: "Auction Server", title: "기존 종료 결과 확인", detail: "이미 완료됐다면 저장된 결과로 수렴", kind: "atomic" },
      { actor: "Main API", title: "기존 거래 확인", detail: "같은 낙찰 결과는 기존 거래를 반환", kind: "followup" },
    ],
  },
  {
    id: "deal-retry",
    title: "거래 생성 실패 후 재처리",
    summary: "후속 거래 반영이 실패하면 런타임 상태를 지우지 않고 이후 재처리에 필요한 정보를 유지하는 흐름입니다.",
    result: "상태 유지 · 후속 재처리 가능",
    documentUrl: `${docsRoot}/06-%EA%B2%BD%EB%A7%A4-%EC%A2%85%EB%A3%8C%EC%99%80-%EB%B3%B5%EA%B5%AC.md`,
    evidence: ["코드에서 구현 확인", "테스트 코드 확인", "흐름 재구성", "추가 검증 필요"],
    before: { 낙찰결과: "확정", 거래반영: "요청 전", 런타임상태: "유지", 재처리: "대기" },
    after: { 낙찰결과: "동일 결과", 거래반영: "후속 재시도 대상", 런타임상태: "유지", 재처리: "추가 통합 검증 필요" },
    steps: [
      { actor: "Auction Server", title: "최종 낙찰 정보 확인", detail: "잠금 안에서 기존 종료 결과와 최종 상태 확인", kind: "atomic" },
      { actor: "Main API", title: "후속 거래 반영 실패", detail: "가상 장애로 실패 응답을 받은 상태", kind: "followup" },
      { actor: "Auction Server", title: "런타임 상태 유지", detail: "성공 전 정리를 중단해 재처리 근거 보존", kind: "recovery" },
      { actor: "Recovery", title: "같은 결과로 후속 처리", detail: "자동 완료를 주장하지 않으며 실제 장애 통합 검증은 별도", kind: "recovery" },
    ],
  },
];

export function getScenario(id: ScenarioId): Scenario {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
}
