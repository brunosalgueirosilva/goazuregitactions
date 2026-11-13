# goazuregitactions — learning repo

A minimal app to learn Azure, Go and GitHub Actions end to end: a Go backend serving a React SPA from one container, deployed to Azure Container Apps with Bicep, by GitHub Actions authenticated through OIDC.

## Repo map (target)

- `backend/` — Go HTTP server, standard library only (`net/http`). Serves `/healthz`, `/api/*` and the built SPA.
- `frontend/` — React + TypeScript + Vite + Tailwind, pnpm. Two pages: Home (sign-in button) and Dashboard (buttons that call the API and print the response).
- `infra/` — Bicep for the resource group's contents (ACR, Container Apps environment, Container App, Log Analytics).
- `.github/workflows/` — PR checks, image build and push, deploy.
- `PLAN.md` — the step-by-step learning plan and progress log.

## Reference project

`/Users/bruno.silva@diconium.com/Source/iam/iamwa` is a production-grade version of the same architecture (Go BFF, React SPA, Bicep, GitHub Actions with OIDC). Use it as a pattern source, not as code to copy wholesale: keep this repo much simpler.

## Toolchain

- Tool versions pinned only in `mise.toml`; workflows read them from it. Don't pin versions in workflows.
- Package managers: Go modules (backend), pnpm (frontend). Never mix them.
- Azure CLI from Homebrew; Bicep through `az bicep` (not on PATH).

## Conventions

- **No committed identifiers:** no subscription/tenant IDs, emails or secrets in tracked files. Workflows read GitHub Environment variables; local values go in a git-ignored `.env`.
- **OIDC only:** GitHub authenticates to Azure with a federated credential; never create client secrets.
- Every `az` command passes `--subscription` explicitly.
- Commits: `<type>: <Summary>` (conventional commits). Ask before `git add`/`git commit`; never `git push`.
