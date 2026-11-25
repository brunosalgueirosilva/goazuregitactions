# goazuregitactions

A hands-on course that builds one small app end to end, so you learn every piece of a production
setup without the production complexity:

- **Go** backend, standard library only, serving a JSON API and a **React** SPA
- packaged as **one container**
- running on **Azure Container Apps**, with infrastructure in **Bicep**
- built and deployed by **GitHub Actions**, which logs in to Azure with **OIDC** (no secrets)

It is written for someone who knows TypeScript/React and AWS/Kubernetes and is new to Go and Azure.
The full step-by-step course is in [docs/PLAN.md](docs/PLAN.md).

## How the course works

You learn with the `dev-teacher` Copilot agent ([.github/agents/dev-teacher.agent.md](.github/agents/dev-teacher.agent.md)):
it explains each concept, writes small pieces of code and gives you the commands to run. You run
them, it explains what happened, and you say "next". The table in [docs/PLAN.md](docs/PLAN.md#how-we-work)
shows how deep each area goes.

## Prerequisites

- [mise](https://mise.jdx.dev) (pins Go, Node and pnpm; see [mise.toml](mise.toml) once Phase 0 is done)
- Docker (Docker Desktop, OrbStack or Colima)
- Azure CLI (`az`) and an Azure subscription where you are at least Contributor
  (see [Permissions you need](docs/PLAN.md#permissions-you-need))
- GitHub CLI (`gh`) and a GitHub account
- VS Code with GitHub Copilot, to use the agent

Azure costs stay at a few euros a month: the app scales to zero and the registry is the Basic
tier. Delete your resource group when you finish ([Cleanup](docs/PLAN.md#cleanup)).

## Start the course

```bash
git clone https://github.com/brunosalgueirosilva/goazuregitactions.git
cd goazuregitactions
git switch -c my-run start                    # the empty starting point
git checkout main -- docs .github README.md   # bring the latest course and agent on top
```

`start` is the repo before any code; the docs on `main` are always newer than it, so the second
command brings them onto your branch. Then open the folder in VS Code, pick the **dev-teacher**
agent in Copilot Chat and say "let's start". Phase 0b moves your run to a repo of your own.

## Jump to a phase

Each phase is one squash-merged commit on `main`, tagged when it is done. To see the finished code
of a phase, or to start from it, check out its tag (and bring the docs as above):

| Tag | Contains | Start here for |
|---|---|---|
| `start` | Copilot agent and instructions only | Phase 0 (tooling) |
| `phase-0` | `mise.toml` with Go, Node and pnpm pinned | Phase 1 (Go backend) |
| `phase-1` | Go backend: API, SPA serving, request logging, graceful shutdown | Phase 2 (React frontend) |

```bash
git switch -c my-run phase-1
git checkout main -- docs .github README.md
```

## Repo layout

| Path | What |
|---|---|
| `backend/` | Go HTTP server (`net/http`): `/healthz`, `/api/*` and the built SPA |
| `frontend/` | React + TypeScript + Vite + Tailwind (from Phase 2) |
| `infra/` | Bicep for the Azure resources (from Phase 5) |
| `.github/workflows/` | PR checks, image build and deploy (from Phase 6) |
| `docs/PLAN.md` | The course |

## Working rules

- `main` only changes through pull requests: one branch per phase, squash-merged, then tagged
  `phase-N`.
- No identifiers in tracked files: subscription and tenant IDs, emails and secrets live in a
  git-ignored `.env` or in GitHub Environment variables.
- GitHub authenticates to Azure only through OIDC federated credentials; no client secrets.
