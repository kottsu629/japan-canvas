package handler

import(
	"database/sql"
	"encoding/json"
	"net/http"		
)

type TouristSpot struct {
	ID           int     `json:"id"`
	PrefectureID int     `json:"prefecture_id"`
	Name         string  `json:"name"`
	Rank         int     `json:"rank"`
	ImageURL     *string `json:"image_url"`
	AffiliateURL *string `json:"affiliate_url"`
	CreatedAt    string  `json:"created_at"`
}

type TouristSpotHandler struct {
	DB *sql.DB
}

func (h *TouristSpotHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		rows, err := h.DB.Query("SELECT id, prefecture_id, name, `rank`, image_url, affiliate_url, created_at FROM tourist_spots ORDER BY id")
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
	}
	