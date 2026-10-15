# Department Books · 부서 전용책

업무 기준, 온보딩, 도구 사용법과 의사결정 기록을 책처럼 관리하는 정적 웹사이트입니다.

## 편집

책과 분야 정보는 `data/books.json` 한 파일에서 관리합니다.

- `site`: 사이트 이름과 설명
- `categories`: 분야 이름·색상
- `books`: 책 제목, 상태, 설명, 주제, 본문 섹션
- 상태: `published`, `writing`, `planned`

로컬 실행:

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

## 배포

`main` 브랜치에 push하면 `.github/workflows/pages.yml`이 GitHub Pages에 자동 배포합니다.

## 라이선스와 원본 표시

이 저장소는 [geniuskey/books](https://github.com/geniuskey/books)를 바탕으로 구조와 디자인을 크게 수정한 파생 프로젝트입니다.

- 원본 실행 코드: MIT
- 원본 콘텐츠와 시각 자료: CC BY 4.0
- 원본 저작자: geniuskey 및 euiyun books contributors
- 변경 사항: 부서 지식 서재 목적에 맞춰 화면, 데이터 구조, 문구, 상호작용과 콘텐츠를 교체했습니다.

자세한 내용은 `LICENSE.md`, `LICENSE-MIT`, `LICENSE-CC-BY-4.0`을 확인하세요.
