package handler

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthHandler struct {
	DB *sql.DB
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	// 1. POSTチェック
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 2. requestのJSONをRegisterRequestに変換
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	// 3. パスワードをbcryptでハッシュ化
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	// 4. DBにINSERT
	_, err = h.DB.Exec(
		"INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
		req.Name, req.Email, string(hash),
	)
	if err != nil {
		log.Println("INSERT error:", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	// 5. 201レスポンスを返す
	w.WriteHeader(http.StatusCreated)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	// 1. POSTチェック
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 2. requestのJSONをLoginRequestに変換
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	// 3. DBからユーザーを取得
	var id int
	var passwordHash string
	err := h.DB.QueryRow(
		"SELECT id, password_hash FROM users WHERE email = ?",
		req.Email,
	).Scan(&id, &passwordHash)
	if err == sql.ErrNoRows {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	} else if err != nil {
		log.Println("SELECT error:", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	// 4. パスワードを比較
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	// 5. ログイン成功（ここではセッション管理などは省略）
	claims := jwt.MapClaims{
		"user_id": id,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte("秘密鍵"))
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token": tokenString,
	})

}
