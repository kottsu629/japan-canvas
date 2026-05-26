package main

import (
	"backend/handler"
	"backend/middleware"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func main() {
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASSWORD")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	name := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4",
		user, pass, host, port, name,
	)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("sql.Open: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("db.Ping: %v", err)
	}

	log.Println("Server starting on :8080...")

	ph := &handler.PrefectureHandler{DB: db}
	http.HandleFunc("/prefectures", corsMiddleware(ph.GetAll))

	ch := &handler.CityHandler{DB: db}
	http.HandleFunc("/cities", corsMiddleware(ch.GetAll))

	ah := &handler.AuthHandler{DB: db}
	http.HandleFunc("/auth/register", corsMiddleware(ah.Register))
	http.HandleFunc("/auth/login", corsMiddleware(ah.Login))

	vh := &handler.VisitedHandler{DB: db}
	http.HandleFunc("/visits", corsMiddleware(middleware.Auth(vh.Handle)))

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("ListenAndServe: %v", err)
	}
}
