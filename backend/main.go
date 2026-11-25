package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", healthz)
	mux.HandleFunc("GET /api/hello", hello)
	mux.HandleFunc("GET /api/time", timeNow)
	mux.HandleFunc("GET /api/", http.NotFound)

	staticDir := envOr("STATIC_DIR", "../frontend/dist")
	mux.Handle("GET /", spaHandler(staticDir))

	addr := ":" + envOr("PORT", "8080")

	revision, onAzure := os.LookupEnv("CONTAINER_APP_REVISION")
	if !onAzure {
		revision = "local"
	}

	server := &http.Server{Addr: addr, Handler: logRequests(mux)}

	go func() {
		log.Printf("revision %s serving %s, listening on http://localhost%s", revision, staticDir, addr)
		if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}()

	<-ctx.Done()
	stop()
	log.Println("shutting down, waiting for in-flight requests")

	// Azure sends SIGKILL 30s after SIGTERM, so finish well before that.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatal("shutdown: ", err)
	}
	log.Println("stopped cleanly")
}
