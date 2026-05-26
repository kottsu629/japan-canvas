package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type City struct {
	ID           int     `json:"id"`
	PrefectureID int     `json:"prefecture_id"`
	Name         string  `json:"name"`
	Rank         int     `json:"rank"`
	ImageURL     *string `json:"image_url"`
	AffiliateURL *string `json:"affiliate_url"`
	CreatedAt    string  `json:"created_at"`
}

type CityHandler struct {
	DB *sql.DB
}

func (h *CityHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	prefID := r.URL.Query().Get("prefecture_id")
	var rows *sql.Rows
	var err error
	if prefID != "" {
		rows, err = h.DB.Query("SELECT id, prefecture_id, name, `rank`, image_url, affiliate_url, created_at FROM cities WHERE prefecture_id = ? ORDER BY `rank`", prefID)
	} else {
		rows, err = h.DB.Query("SELECT id, prefecture_id, name, `rank`, image_url, affiliate_url, created_at FROM cities ORDER BY prefecture_id, `rank`")
	}
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var cities []City
	for rows.Next() {
		var c City
		var imgURL, affURL sql.NullString
		if err := rows.Scan(&c.ID, &c.PrefectureID, &c.Name, &c.Rank, &imgURL, &affURL, &c.CreatedAt); err != nil {
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		if imgURL.Valid {
			c.ImageURL = &imgURL.String
		}
		if affURL.Valid {
			c.AffiliateURL = &affURL.String
		}
		cities = append(cities, c)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cities)
}
