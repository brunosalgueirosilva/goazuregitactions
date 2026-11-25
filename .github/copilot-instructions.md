# goazuregitactions — learning repo

A minimal app to learn Azure, Go and GitHub Actions end to end: a Go backend serving a React SPA from one container, deployed to Azure Container Apps with Bicep, by GitHub Actions authenticated through OIDC.

## Repo map (target)

- `backend/` — Go HTTP server, standard library only (`net/http`). Serves `/healthz`, `/api/*` and the built SPA.
- `frontend/` — React + TypeScript + Vite + Tailwind, pnpm. Two pages: Home (sign-in button) and Dashboard (buttons that call the API and print the response).
- `infra/` — Bicep for the resource group's contents (ACR, Container Apps environment, Container App, Log Analytics).
- `.github/workflows/` — PR checks, image build and push, deploy.
- `docs/PLAN.md` — the course: phases and steps, generic for any learner.
- `.specs/PROGRESS.md` — the learner's personal progress (current step, roles found, log). Git-ignored, so workspace search skips it: open it by path. Create it from the template in `docs/PLAN.md` if missing.

## Learning style

The user is learning Go, Azure, Bicep and GitHub Actions here. Depth per area:

| Area | AI writes code | AI runs commands | Explanations |
|---|---|---|---|
| Go | Yes, in small steps (one concept, ~30 lines max) | No | Deep, compared with TypeScript/Express |
| Azure (CLI and portal) | — | No | Deep: every resource and flag; CLI first, then reset, then portal click by click |
| Bicep | Yes, one resource at a time | No | Deep |
| GitHub Actions | Yes | No | Medium |
| Docker | Yes | No | Brief |
| React frontend | Yes, all at once | Yes | None |

- Outside the frontend, never run terminal, `az`, `gh`, `docker` or `git` commands: give the command, explain it, say what the user should see, and wait for them to run it and report back.
- Stop after each step and wait for the user to say "next".
- No unit tests. Checks are `go vet`, builds, and manual `curl`/browser tests.
- Sign-in stays fake (a button that navigates to the dashboard).

## Reference project (optional)

If the user names a production-grade project with the same architecture (its local path may be in `.specs/PROGRESS.md`), use it as a pattern source, not as code to copy wholesale: keep this repo much simpler. Never mention its name, paths or internals in tracked files.

## Toolchain

- Tool versions pinned only in `mise.toml`; workflows read them from it. Don't pin versions in workflows.
- Package managers: Go modules (backend), pnpm (frontend). Never mix them.
- Azure CLI from Homebrew; Bicep through `az bicep` (not on PATH).

## Conventions

- **No committed identifiers:** no subscription/tenant IDs, emails or secrets in tracked files. Workflows read GitHub Environment variables; local values go in a git-ignored `.env`.
- **OIDC only:** GitHub authenticates to Azure with a federated credential; never create client secrets.
- Every `az` command passes `--subscription` explicitly.
- Git workflow: `main` only changes through PRs. One branch per phase (`phase-N-<name>`), squash-merged, then tagged `phase-N` (annotated). When a phase adds a tag, add its row to the tags table in `README.md`.
- Commits: `<type>: <Summary>` (conventional commits). Ask before `git add`/`git commit`; never `git push`.
