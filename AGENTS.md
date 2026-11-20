# Today Date — Codex 지침

이 리포의 작업 규칙은 루트 `CLAUDE.md` 가 단일 출처다. 작업을 시작하기 전에 `CLAUDE.md` 를 읽고 그대로 따른다.
이 파일에는 규칙을 다시 적지 않고, 아래 Codex 전용 차이만 둔다. 규칙이 서로 다르게 보이면 `CLAUDE.md` 를 따른다.

## Codex 전용 차이
- **디자인 기준**: 화면 디자인은 `.claude/skills/today-date-design/SKILL.md` 를 직접 읽고 따른다. `.agents/skills/` 아래 사본은 `.gitignore` 대상이며 기준이 아니다.
- **worktree 경로**: Codex 는 worktree 를 리포 밖 `$CODEX_HOME/worktrees`(기본 `~/.codex/worktrees`)에서 관리한다. 그래서 `CLAUDE.md` 의 리포 안 `.claude/worktrees/<이름>` 경로는 Codex 에 해당하지 않는다. 원래 작업 폴더의 브랜치를 바꾸지 않는다는 원칙과 나머지 동시 세션 안전 규칙(커밋 전 브랜치 확인, 푸시 후 원격 SHA 확인, 포트, `.env.local`, 내가 만든 worktree 만 제거)은 `CLAUDE.md` 와 같다.
