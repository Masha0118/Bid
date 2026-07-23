# 사용자 확인 필요

## 우선순위 1: 배포

- `https://bidon-performance.duckdns.org/`의 Cloudflare Pages Production 배포 상태를 확인합니다.
- 현재 화면에서 `실행 비활성화`가 표시되고 서버 상태 확인이 끝나지 않으므로, 체험 백엔드 연결과 HTTPS 요청을 확인합니다.
- 연결 복구 후 `새 테스트 시작`, 직접 입찰, 가상 입찰과 `고급 성능 보기`를 순서대로 확인합니다.
- GitHub About의 Website를 위 주소로 설정합니다.

## 우선순위 2: 화면 자료

현재 배포 상태에서는 실제 체험 결과가 포함된 대표 이미지를 만들지 않았습니다. 연결이 활성화된 최신 화면에서 다음 자료를 준비합니다.

- 경매 시작 전 전체 화면
- 직접 입찰 직후
- 가상 참가자 실행 중
- 참가자 카드 동기화
- 데이터 흐름 시각화
- 최종 결과와 정합성 확인
- 고급 성능 결과

대표 이미지는 개인정보, 내부 주소와 내부 식별자가 보이지 않는지 확인한 뒤 `assets/overview.webp`로 추가합니다. README 상단에는 대표 이미지 한 장만 우선 사용합니다.

## 우선순위 3: 검증 결과

- 최신 격리 환경에서 Verified Run을 생성합니다.
- 실행 시각, 참가자 수, 입찰 속도, 실행 시간과 테스트 환경을 기록합니다.
- 실제 응답 시간, p95와 처리량을 결과 파일 그대로 확인합니다.
- 참가자 Version, 최종 최고가와 최고 입찰자 일치 여부를 기록합니다.
- Kafka는 전달 요청과 최종 저장 완료 중 어디까지 확인했는지 구분합니다.

## GitHub 설정

- Description: `Redis Lua와 WebSocket으로 구현한 직접 체험 가능한 실시간 경매 시스템`
- Website: `https://bidon-performance.duckdns.org/`
- Topics: `java`, `spring-boot`, `redis`, `lua`, `websocket`, `kafka`, `rabbitmq`, `postgresql`, `docker`, `vue`, `real-time`, `auction`, `concurrency`, `system-design`
- Social Preview: 연결이 활성화된 최신 대표 화면 사용
- 저장소 Visibility 확인
- LICENSE 선택: 현재 LICENSE가 없으므로 소유자가 배포·재사용 정책을 결정한 뒤 추가
