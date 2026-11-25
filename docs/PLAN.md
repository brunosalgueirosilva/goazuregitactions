# Learning plan: Go + React on Azure Container Apps, deployed by GitHub Actions

Goal: build a tiny version of a production web app architecture and understand every piece: one
container (Go server + React SPA) on Azure Container Apps, infra in Bicep, CI/CD in GitHub Actions
authenticated to Azure with OIDC. See the [README](../README.md) for how to start.

"You" is the learner; "AI" is the `dev-teacher` Copilot agent in `.github/agents/`. Your personal
progress (current step, notes) goes in a git-ignored `.specs/PROGRESS.md`; this file stays generic.

## How we work

| Area | Who writes the code | Who runs commands | Explanations |
|---|---|---|---|
| Go | AI, in small steps (one concept each) | **You** | Deep: stop after every step, explain each new construct, compare with TypeScript/Express |
| Azure | — | **You** (CLI first, then portal) | Deep: what each resource is, why it exists, what each flag does |
| Bicep | AI, one resource at a time | **You** | Deep: syntax, references, dependencies, what Azure does on deploy |
| GitHub Actions | AI | **You** | Medium: structure, triggers, permissions, how a run maps to the YAML |
| Docker | AI | **You** | Brief: you already know Docker |
| React frontend | AI, all at once | AI | None: just make it work |

Rules:

- AI never runs a command for you, except in Phase 2. It gives the command, explains it, says what
  you should see, and waits for you to paste the output or say "done".
- AI stops after each step and waits for "next" before continuing.
- No unit tests: this is a learning repo. Checks are `go vet`, builds, and manual `curl`/browser tests.
- Git: `main` only changes through PRs (ruleset `protect-main`). One branch per phase
  (`phase-1-go-backend`, ...), squash-merged, so each phase is one commit on `main`. After each
  merge, tag `main` as `phase-N` (annotated); a `protect-phase-tags` ruleset stops tags moving.
  AI never pushes.
- Sign-in stays fake (a button that navigates to the dashboard).

## Concepts cheat sheet (Azure ↔ what you know)

| Azure | AWS / Kubernetes | Notes |
|---|---|---|
| Tenant (Entra ID directory) | AWS Organization + IAM users | Where users, groups and app registrations live |
| Subscription | AWS account | Billing + permission boundary |
| Resource group (RG) | CloudFormation stack / namespace | Folder for resources; deleting it deletes everything inside |
| Role assignment (RBAC) | IAM policy attachment | *who* + *role* + *scope* (subscription, RG or one resource) |
| App registration + service principal | IAM user/role for an app | GitHub Actions logs in as one |
| Federated credential | IAM OIDC identity provider trust | "Trust tokens from GitHub repo X, environment dev"; no secret |
| Managed identity | IAM role for EC2 / IRSA | An identity Azure gives a resource (e.g. a Container App) |
| Container Registry (ACR) | ECR | Stores images |
| Container Apps environment | EKS cluster (managed, invisible nodes) | Shared network + logging for apps |
| Container App | Deployment + Service + Ingress + HPA | Each change creates a new *revision* (≈ ReplicaSet) |
| Log Analytics workspace | CloudWatch Logs | Query with KQL |
| Bicep | CloudFormation (nicer syntax) | Compiles to ARM JSON; `what-if` ≈ `terraform plan` |

## Permissions you need

| To… | You need | Phases |
|---|---|---|
| Create resource groups and resources | **Contributor** on the subscription (or on an RG someone creates for you) | 4, 5 |
| Create role assignments | **Owner**, **User Access Administrator** or **Role Based Access Control Administrator**; scoped to your RG is enough | 7, 9 |
| Create app registrations | Entra ID → User settings → "Users can register applications" = Yes, or the **Application Developer** role | 7 |

Check your Azure roles (record the result in `.specs/PROGRESS.md`):

```bash
az role assignment list --subscription "$SUB" --assignee "$(az ad signed-in-user show --query id -o tsv)" --all -o table
```

If you are only Contributor, ask a subscription Owner for **Role Based Access Control
Administrator** scoped to *your RG only*, right after creating it in Phase 4.

## Shell variables used throughout

```bash
# In a git-ignored .env; run `source .env` in every new terminal.
export SUB="<your subscription name or id>"
export RG="rg-<yourname>-azure-learning"
export LOC="westeurope"
```

Every `az` command passes `--subscription "$SUB"`; never rely on the default.

---

## Phase 0 — Tooling

- `mise use go@1.27.3 node@26.13.0 pnpm@12.16.1 && mise install` (writes `mise.toml`)
- Docker Desktop (or OrbStack/Colima) running
- `az` logged in; `az bicep install`
- `gh auth login`

**Test:** `go version && node -v && pnpm -v && docker version && az bicep version && gh auth status`

### 0b. Your own GitHub repo with a protected `main`

Starting from the `start` tag (see the README), you publish your run as your own repo, so the
GitHub Actions phases deploy from it.

- If the repo will be public, use your GitHub noreply address for commits in this repo only:
  `git config user.email "$(gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"')"`
- Commit the course docs you brought onto your branch: `git commit -m "docs: Add the course"`
- `git remote rename origin upstream`, then
  `gh repo create <you>/goazuregitactions --public --source . --remote origin` and
  `git push -u origin my-run:main` (public: free accounts only enforce rulesets on public repos)
- Squash-only merges, delete branch on merge:
  `gh repo edit --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge`
- Ruleset `protect-main` on the default branch: no deletion, no force-push, PR required
  (0 approvals: you cannot approve your own PR), no bypass
- Ruleset `protect-phase-tags` on `refs/tags/phase-*`: no deletion, no update
- Branch `phase-0-tooling` with `mise.toml`, PR, squash-merge, tag `phase-0`

**Test:** `git push origin HEAD:main` from a branch is rejected with `GH013`; the PR merges.

---

## Phase 1 — Go backend (deep, step by step)

Each step: AI explains the concepts, writes a small piece of code, you run it, AI explains what
happened. Express comparisons throughout.

- **1.1 Modules.** You run `go mod init`. Learn: module vs package, `go.mod` vs `package.json`,
  why there is no `node_modules`.
- **1.2 Hello world.** `package main`, `import`, `func main`, `fmt.Println`. You run `go run .`
  and `go build`, then execute the binary. Learn: compiled single binary vs Node runtime.
- **1.3 Smallest HTTP server.** `net/http`, `http.ListenAndServe`, the handler signature
  `(w http.ResponseWriter, r *http.Request)`, pointers (`*`) in one paragraph, errors as return
  values and `log.Fatal`. Test with `curl`.
- **1.4 Routing.** `http.NewServeMux`, method patterns (`"GET /api/hello"`), `/healthz`.
  Compare with `app.get(...)`. Learn: variables (`:=` vs `var`), functions as values.
- **1.5 JSON responses.** Structs with JSON tags vs `map[string]string`, `encoding/json`,
  headers, query params (`?name=`). Add `/api/hello` and `/api/time`. Learn: types, exported vs
  unexported (capital letters).
- **1.6 Configuration.** `os.Getenv`, a small `envOr` helper, multiple return values,
  `if v := ...; cond` form, `os.LookupEnv`. Note: Container Apps does **not** set `PORT` (it sets
  `CONTAINER_APP_PORT`, `CONTAINER_APP_REVISION`, ...); we default to 8080, the app's target port.
- **1.7 Serving the SPA.** `http.FileServer`, falling back to `index.html` for client routes,
  the `http.Handler` **interface** and `http.HandlerFunc` adapter, closures. Learn: Go interfaces are
  implicit (no `implements`).
- **1.8 Middleware.** Request logging by wrapping a handler. Compare with Express middleware.
- **1.8b Status in the log.** Wrap `ResponseWriter` in a `statusRecorder`: struct embedding,
  pointer receivers, `&`.
- **1.9 Split files.** Move handlers to `handlers.go` in the same package. Learn: package
  scope, file layout, `gofmt`, `go vet`.
- **1.10 Graceful shutdown.** Goroutines, channels, `context`, `signal.NotifyContext`,
  `server.Shutdown`, `defer`. Learn: Container Apps sends SIGTERM, then SIGKILL after 30 seconds.

**Test (end of phase):** `go vet ./...` is clean; `curl localhost:8080/api/hello?name=you`,
`/api/time` and `/healthz` respond; Ctrl+C logs a clean shutdown.

---

## Phase 2 — React frontend (AI builds it, no explanations)

AI scaffolds and builds it, runs the commands, and reports when it works.

- Vite + React + TypeScript (strict) + Tailwind + react-router, pnpm, `"packageManager"` set
- Home page with a "Sign in" button that navigates to `/dashboard` (fake sign-in)
- Dashboard with two buttons calling `/api/hello` and `/api/time`, printing status + JSON
- Vite dev proxy `/api` → `http://localhost:8080`
- Lint with Oxlint (Vite's default for React templates): `pnpm lint`

**Test:** `go run .` in `backend/`, `pnpm dev` in `frontend/`, click through in the browser. Then
`pnpm build` and open `http://localhost:8080` (Go serves `frontend/dist`); reload on `/dashboard`.

---

## Phase 3 — One container (brief)

AI writes a multi-stage `Dockerfile` (Node builds the SPA, Go builds a static binary, distroless
runtime) and `.dockerignore`. AI explains only what differs from Node images: static Go binaries,
`CGO_ENABLED=0`, distroless, and why Apple Silicon must build `--platform linux/amd64` for Azure.

**Test:** you run
`docker build --platform linux/amd64 -t goazure:local . && docker run --rm -p 8080:8080 goazure:local`,
open `http://localhost:8080`, reload on `/dashboard`, click both buttons.

---

## Phase 4 — Azure, two ways (deep)

### 4a. CLI (see it working fast)

You run each command after AI explains the resource and every flag.

- Resource group:
  ```bash
  az group create --subscription "$SUB" --name "$RG" --location "$LOC" --tags owner=<yourname> purpose=learning
  ```
  Then ask for the RBAC Administrator role on it (see permissions).
- Container registry, with the admin user as a temporary way to pull images (explained in Phase 9):
  ```bash
  export ACR="acr<yourname>learn"   # 5-50 lowercase letters/digits, globally unique
  az acr create --subscription "$SUB" -g "$RG" -n "$ACR" --sku Basic --admin-enabled true
  az acr login --subscription "$SUB" -n "$ACR"
  docker build --platform linux/amd64 -t "$ACR.azurecr.io/app:v1" .
  docker push "$ACR.azurecr.io/app:v1"
  ```
- Container Apps environment (creates a Log Analytics workspace too):
  ```bash
  az containerapp env create --subscription "$SUB" -g "$RG" -n cae-learn -l "$LOC"
  ```
- Container App, scaling to zero when idle:
  ```bash
  az containerapp create --subscription "$SUB" -g "$RG" -n ca-learn \
    --environment cae-learn --image "$ACR.azurecr.io/app:v1" \
    --target-port 8080 --ingress external \
    --registry-server "$ACR.azurecr.io" \
    --registry-username "$(az acr credential show --subscription "$SUB" -n "$ACR" --query username -o tsv)" \
    --registry-password "$(az acr credential show --subscription "$SUB" -n "$ACR" --query 'passwords[0].value' -o tsv)" \
    --min-replicas 0 --max-replicas 1 \
    --query properties.configuration.ingress.fqdn -o tsv
  ```
- Ship a change: edit the hello message, build and push `app:v2`, then
  `az containerapp update --subscription "$SUB" -g "$RG" -n ca-learn --image "$ACR.azurecr.io/app:v2"`.

**Test:** `curl https://<fqdn>/api/hello` (first call is slow: cold start from zero). In the
portal, open the app and look at Revisions, Log stream, Ingress, Secrets, Metrics.

### 4b. Reset

- `az group delete --subscription "$SUB" -n "$RG"`; recreate the empty RG. Role assignments
  die with the RG, so the RBAC role must be granted again.

### 4c. Portal (guided, click by click)

AI gives one screen at a time; you describe what you see before moving on.

- Create the resource group (Resource groups → Create).
- Create the container registry (Basic SKU), then enable **Access keys → Admin user**.
- Push the image from your terminal (the portal cannot push images).
- Create the Container App; its wizard also creates the environment and Log Analytics. Pick
  the image from your ACR, enable ingress on port 8080, set scale 0–1.
- Ship v2 via **Revisions → Create new revision** and watch traffic move.
- Explore: Log Analytics → Logs, run a KQL query for your container's logs.

**Test:** same as 4a. Then reset again (4b) so Bicep starts from an empty RG.

---

## Phase 5 — Bicep (deep, one resource at a time)

Each step: AI adds one resource and explains it; you run `what-if`, then `create`, then find the
resource in the portal.

```bash
az bicep build --file infra/main.bicep        # compile + lint
az deployment group what-if --subscription "$SUB" -g "$RG" -f infra/main.bicep
az deployment group create  --subscription "$SUB" -g "$RG" -f infra/main.bicep --query properties.outputs
```

- **5.1 Skeleton.** `targetScope`, `param`, `var`, `output`, `resourceGroup().location`.
  Deploy an empty template and look at RG → Deployments.
- **5.2 Log Analytics.** `resource` syntax, symbolic name vs Azure name, API versions,
  properties. Compare with what the portal created in 4c (**Export template**).
- **5.3 Registry.** `uniqueString(resourceGroup().id)` for globally unique names.
- **5.4 Environment.** Referencing another resource (`logs.properties.customerId`), implicit
  dependencies, `listKeys()`.
- **5.5 Container App with a placeholder image.** Secrets, registries, ingress, scale,
  `listCredentials()`.
- **5.6 Your image.** An `image` parameter. Push the image to the new ACR, redeploy with
  `-p image=...`.
- **5.7 The trap.** Redeploy *without* `image` and watch the app go back to the placeholder.
  Learn why production setups look up the running image before deploying, and guard the very
  first deploy separately.

**Test:** your app runs from Bicep; a second `what-if` with no changes shows nothing to change.

---

## Phase 6 — PR checks (medium)

The repo and the `protect-main` ruleset already exist (Phase 0b).

- AI writes `.github/workflows/ci.yml` and explains: `on` triggers, jobs vs steps, runners,
  `uses` vs `run`, `working-directory`, `permissions`, reading tool versions from `go.mod`,
  `package.json` and `mise.toml`.
- Jobs: backend (`go vet`, `go build`), frontend (`pnpm lint`, `pnpm build`), infra (`az bicep build`).
- Add these checks as required status checks to the `protect-main` ruleset.

**Test:** a PR with a Go compile error goes red; fixing it goes green.

---

## Phase 7 — GitHub → Azure with OIDC, deploy on merge (medium-deep)

Needs the RBAC Administrator role on your RG. AI first explains the OIDC flow (GitHub issues a
token, Entra trusts it through the federated credential, `azure/login` swaps it for an Azure token).

- **CLI:** you create the app registration, service principal, federated credential and role assignment:
  ```bash
  APP_ID=$(az ad app create --display-name gh-goazuregitactions --query appId -o tsv)
  az ad sp create --id "$APP_ID"
  cat > /tmp/fic.json <<EOF
  {"name": "github-env-dev",
   "issuer": "https://token.actions.githubusercontent.com",
   "subject": "repo:<owner>/goazuregitactions:environment:dev",
   "audiences": ["api://AzureADTokenExchange"]}
  EOF
  az ad app federated-credential create --id "$APP_ID" --parameters /tmp/fic.json
  az role assignment create --assignee "$APP_ID" --role Contributor \
    --scope "$(az group show --subscription "$SUB" -n "$RG" --query id -o tsv)"
  ```
- **Portal:** find the same objects (Entra ID → App registrations → Certificates & secrets →
  Federated credentials; RG → Access control (IAM)). Optionally delete and recreate them through
  the portal, guided.
- **GitHub:** environment `dev` with variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`,
  `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, `ACR_NAME`, `CONTAINER_APP_NAME` (`gh variable set ... --env dev`).
- AI writes `.github/workflows/deploy.yml`: on push to `main`, build, push to ACR,
  `az containerapp update --image`, smoke-test with `curl`.

**Test:** merge a changed hello message; the deploy run goes green and the live URL shows it.

---

## Phase 8 — Infra deploys from GitHub (medium)

- `.github/workflows/infra.yml`: on manual dispatch and on pushes touching `infra/**`. It reads
  the running image and passes it to Bicep so an infra deploy never resets the app (our simple fix
  for the 5.7 trap).
- A `what-if` job on pull requests touching `infra/**`.

**Test:** change `maxReplicas` to 2 in a PR, read the what-if, merge, see it under Scale in the
portal; the running image is unchanged.

---

## Phase 9 — Passwordless image pulls with a managed identity (optional)

Until now the Container App pulls images with the registry's admin **username and password**,
stored as a secret on the app. That works, but it is a shared password that never expires. A
**managed identity** is an identity Azure attaches to the app (like IRSA giving a pod an IAM role):
we grant it `AcrPull` on the registry, turn the admin user off, and no password exists anymore.
This is how production setups usually do it. Needs a role that can create role assignments.

- Portal first: create a user-assigned managed identity, grant it AcrPull on the ACR
  (ACR → Access control (IAM)), point the app's registry setting at the identity, disable the admin user.
- Then the same in Bicep: an identity resource, an `AcrPull` role assignment, and the app's
  `registries` pointing at the identity.

**Test:** with the admin user disabled, a new revision still pulls the image and starts.

---

## Cleanup

```bash
az group delete --subscription "$SUB" -n "$RG" --yes
az ad app delete --id "$APP_ID"
```

---

## Your progress file

Keep this in `.specs/PROGRESS.md` (git-ignored, so personal details never get committed):

```markdown
# Progress

Current step: 0 (Tooling)
Subscription: <name>
Roles found: <output of the role check in "Permissions you need">
Reference project (optional, local path): <path>

| Date | Phase | Notes |
|---|---|---|
```
