package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

type Prefecture struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Region string `json:"region"`
}
type TouristSpot struct {
	ID           int     `json:"id"`
	PrefectureID int     `json:"prefecture_id"`
	Name         string  `json:"name"`
	Rank         int     `json:"rank"`
	ImageURL     *string `json:"image_url"`
	AffiliateURL *string `json:"affiliate_url"`
	CreatedAt    string  `json:"created_at"`
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

	http.HandleFunc("/prefectures", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		rows, err := db.Query("SELECT id, name, region FROM prefectures ORDER BY id")
		if err != nil {
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var prefectures []Prefecture
		for rows.Next() {
			var p Prefecture
			if err := rows.Scan(&p.ID, &p.Name, &p.Region); err != nil {
				http.Error(w, "internal server error", http.StatusInternalServerError)
				return
			}
			prefectures = append(prefectures, p)
		}

		if err := rows.Err(); err != nil {
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(prefectures); err != nil {
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
	})

	http.HandleFunc("/tourist_spots", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		rows, err := db.Query("SELECT id, prefecture_id, name, `rank`, image_url, affiliate_url, created_at FROM tourist_spots ORDER BY id")
		if err != nil {
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var touristSpots []TouristSpot
		for rows.Next() {
			var ts TouristSpot
			var imgURL, affURL sql.NullString
			if err := rows.Scan(&ts.ID, &ts.PrefectureID, &ts.Name, &ts.Rank, &imgURL, &affURL, &ts.CreatedAt); err != nil {
				http.Error(w, "internal server error", http.StatusInternalServerError)
				return
			}
			if imgURL.Valid {
				ts.ImageURL = &imgURL.String
			}
			if affURL.Valid {
				ts.AffiliateURL = &affURL.String
			}
			touristSpots = append(touristSpots, ts)
		}

		if err := rows.Err(); err != nil {
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(touristSpots); err != nil {
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
	})
	log.Println("Server starting on :8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("ListenAndServe: %v", err)
	}

}
