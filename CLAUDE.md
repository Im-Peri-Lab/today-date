# Today Date — Claude Code 지침

프로젝트 컨텍스트는 `docs/handoff/`(PROJECT_CONTEXT·CURRENT_STATE·CHANGELOG), 화면 디자인은 `.claude/skills/today-date-design/SKILL.md` 가 단일 출처다.

## 동시 세션 안전 규칙
같은 작업 폴더를 여러 세션이 함께 쓰면 브랜치가 서로 바뀐다(261120 사고, PR #171 → PROJECT_CONTEXT §20).
- 새 브랜치 작업은 전용 worktree(`.claude/worktrees/<이름>`, `git worktree add -b <브랜치> .claude/worktrees/<이름> origin/main`)에서 한다. 원래 작업 폴더의 브랜치는 바꾸지 않는다.
- 커밋·푸시 직전에 `git branch --show-current` 가 의도한 브랜치인지 확인한다. 다르거나 내가 수정하지 않은 변경이 보이면 멈추고 보고한다. 푸시 후 `git ls-remote` 로 원격 SHA 가 내 커밋인지 확인한다.
- 로컬 서버 포트(기본 3000)가 사용 중이면 다른 포트를 쓴다(`npm run dev -- -p 3001`). worktree 에는 `.env.local` 이 없으니 필요하면 보고한다.
- 작업이 끝나면(머지 후) 내가 만든 worktree 만 제거한다. 다른 worktree·브랜치는 건드리지 않는다.

## 머지 후 문서 정리
- PR 머지와 작업 브랜치 삭제를 확인한 뒤, 같은 작업에서 `docs/handoff/`의 관련 문서에 머지 PR·커밋, 검증 결과, 남은 확인 사항을 기록한다.
- 문서만 수정하는 후속 커밋은 최신 `main`에 바로 반영한다. 문서용 브랜치나 PR을 만들지 않는다. 원격 `main`의 SHA를 확인한 뒤 작업 완료를 보고한다.
