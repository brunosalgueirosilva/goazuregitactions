package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

type helloResponse struct {
	Message string `json:"message"`
	Name    string `json:"name"`
	secret  string
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	err := json.NewEncoder(w).Encode(v)
	if err != nil {
		log.Println("writeJSON:", err)
	}
}

func healthz(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "ok")
}

func hello(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		name = "world"
	}
	writeJSON(w, http.StatusOK, helloResponse{
		Message: "Hello, " + name + "!",
		Name:    name,
		secret:  "never sent",
	})
}

func timeNow(w http.ResponseWriter, r *http.Request) {
	now := time.Now().UTC()
	writeJSON(w, http.StatusOK, map[string]string{
		"utc":     now.Format(time.RFC3339),
		"weekday": now.Weekday().String(),
	})
}

// spaHandler serves the built SPA from dir. Paths that are not a file (client-side routes
// like /dashboard) get index.html, so React Router can render them.
func spaHandler(dir string) http.Handler {
	files := http.FileServer(http.Dir(dir))
	index := filepath.Join(dir, "index.html")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(dir, filepath.Clean(r.URL.Path))
		if info, err := os.Stat(path); err != nil || info.IsDir() {
			http.ServeFile(w, r, index)
			return
		}
		files.ServeHTTP(w, r)
	})
}
