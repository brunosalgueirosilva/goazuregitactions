# syntax=docker/dockerfile:1

# Tool versions live only in mise.toml; pass them in (see the build command in docs/PLAN.md, Phase 3).
ARG NODE_VERSION
ARG GO_VERSION

# 1. Build the SPA. Its output is plain HTML/JS/CSS, so it runs on the build machine's own CPU.
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS frontend
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /src/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm build

# 2. Build a static Go binary, cross-compiled for the target platform (linux/amd64 for Azure).
FROM --platform=$BUILDPLATFORM golang:${GO_VERSION}-alpine AS backend
ARG TARGETOS
ARG TARGETARCH
WORKDIR /src/backend
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -trimpath -ldflags="-s -w" -o /out/server .

# 3. Runtime: no shell, no package manager, runs as a non-root user.
FROM gcr.io/distroless/static-debian13:nonroot
WORKDIR /app
COPY --from=backend /out/server ./server
COPY --from=frontend /src/frontend/dist ./static
ENV STATIC_DIR=/app/static \
    PORT=8080
EXPOSE 8080
ENTRYPOINT ["/app/server"]
