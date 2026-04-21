package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type Prefecture struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Region string `json:"region"`
}

type PrefectureHandler struct {
	DB *sql.DB
}

func (h *PrefectureHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := h.DB.Query("SELECT id, name, region FROM prefectures ORDER BY id")
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
	json.NewEncoder(w).Encode(prefectures)
}
