package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type Visit struct {
	ID           int    `json:"id"`
	UserID       int    `json:"user_id"`
	PrefectureID int    `json:"prefecture_id"`
	VisitedAt    string `json:"visited_at"`
	CreatedAt    string `json:"created_at"`
}
type VisitedHandler struct {
	DB *sql.DB
}

func (h *VisitedHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID := r.Context().Value("user_id").(int)

	rows, err := h.DB.Query("SELECT id, user_id, prefecture_id, visited_at, created_at FROM visits WHERE user_id = ? ORDER BY id", userID)

	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	visits := []Visit{}
	for rows.Next() {
		var v Visit
		if err := rows.Scan(&v.ID, &v.UserID, &v.PrefectureID, &v.VisitedAt, &v.CreatedAt); err != nil {
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		visits = append(visits, v)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(visits)
}

func (h *VisitedHandler) Create(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// contextからuser_idを取り出す
	userID := r.Context().Value("user_id").(int)

	var req struct {
		PrefectureID int    `json:"prefecture_id"`
		VisitedAt    string `json:"visited_at"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	_, err := h.DB.Exec(
		"INSERT INTO visits (user_id, prefecture_id, visited_at) VALUES (?, ?, NOW())",
		userID, req.PrefectureID,
	)

	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *VisitedHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)
	var req struct {
		PrefectureID int `json:"prefecture_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	_, err := h.DB.Exec(
		"DELETE FROM visits WHERE user_id = ? AND prefecture_id = ?",
		userID, req.PrefectureID,
	)
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *VisitedHandler) Handle(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.GetAll(w, r)
	case http.MethodPost:
		h.Create(w, r)
	case http.MethodDelete:
		h.Delete(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}
