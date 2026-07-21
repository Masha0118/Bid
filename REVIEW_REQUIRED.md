# 사용자 검토 필요 항목

자동으로 판단하거나 삭제하지 않고 소유자의 확인이 필요한 항목입니다.

## GitHub Pages

- 저장소 Settings에서 GitHub Pages의 Source가 **GitHub Actions**로 설정됐는지 확인합니다.
- 배포 후 예상 URL `https://masha0118.github.io/Bid/`와 여섯 개 Query Parameter 딥링크를 직접 확인합니다.
- 저장소명이나 기본 브랜치가 바뀌면 Workflow와 문서 링크를 함께 갱신합니다.

## 기존 screenshots 공개 여부

`screenshots/`의 실제 이미지 12개는 사용자가 만든 자료라 자동 삭제하지 않았습니다. 다만 대표 표본을 확인한 결과 다음 정보가 보여 현재 상태로 공개 사용하기 어렵습니다.

- `admin-member-action.jpg`: 이메일 주소, 위치, 닉네임, 내부 사용자 식별자와 계정 상태
- `realtime-bid-two-clients.jpg`: 개발 도구, 로컬 실행 화면과 테스트 사용자 정보
- 앱 화면 이미지: 실제 Flutter UI와 상품 사진

공개 저장소에 이미 추적 중이라면 민감정보를 비식별 처리한 대체본으로 교체하거나, 공개 의도가 없다면 별도 확인 후 Git 이력까지 고려해 제거해야 합니다. 이번 작업에서는 README와 Flow Console에서 이 이미지들을 링크하지 않았습니다.

## Flow Console 미리보기 영상

대표 정적 이미지만 생성합니다. GIF 또는 동영상은 임의로 만들지 않았습니다. 필요하다면 동시 입찰 선택 → 두 요청 → Redis Lua 처리 → Version 변경 → WebSocket·Kafka 후속 처리 → 최종 결과 순서로 사용자가 직접 검토해 제작해야 합니다.
