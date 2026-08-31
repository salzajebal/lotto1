---
name: 엑셀 워커 모듈 로딩
description: Node eval 워커에서 워크스페이스 패키지를 안정적으로 불러오는 방법
---

Node의 `eval` 워커에서는 워크스페이스 하위 패키지의 모듈 탐색 기준이 실행 환경마다 달라질 수 있으므로, 패키지명을 워커에서 직접 `require`하지 않는다. 메인 스레드에서 패키지 경로를 해석해 파일 URL로 전달하고 워커에서는 동적 `import()`로 불러온다.

**Why:** 개발·배포 런타임에 따라 eval 워커가 루트 경로에서 모듈을 찾거나 ESM으로 평가되어, 설치된 패키지도 `Cannot find module` 또는 `require is not defined` 오류가 날 수 있다.

**How to apply:** 서버의 워커 스레드에서 워크스페이스 의존성을 사용할 때 메인 스레드의 `createRequire(...).resolve(...)`와 `pathToFileURL(...)`을 사용하고, 실제 배포와 같은 ESM 워커 방식으로 파일 파싱을 검증한다.