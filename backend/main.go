package main

import (
	"backend/handler"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

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
	http.HandleFunc("/prefectures", ph.GetAll)

	th := &handler.TouristSpotHandler{DB: db}
	http.HandleFunc("/tourist_spots", th.GetAll)

	ah := &handler.AuthHandler{DB: db}
	http.HandleFunc("/auth/register", ah.Register)

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("ListenAndServe: %v", err)
	}
}
