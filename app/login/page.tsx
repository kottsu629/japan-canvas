"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthCard from "../components/AuthCard";
import Input from "../components/Input";
import { API_BASE } from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push("/map");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? "ログインに失敗しました");
      }
    } catch {
      alert("サーバーに接続できませんでした");
    }
  };

  return (
    <AuthCard>
      <div className="space-y-4">
        <Input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-700 transition-colors"
        >
          ログイン
        </button>
      </div>
      <p className="text-center text-xs text-gray-400 mt-6">
        アカウントをお持ちでない方は{" "}
        <Link href="/register" className="text-blue-500 hover:underline">
          新規登録
        </Link>
      </p>
    </AuthCard>
  );
}
