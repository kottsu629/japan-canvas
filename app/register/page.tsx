"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthCard from "../components/AuthCard";
import Input from "../components/Input";
import { API_BASE } from "../lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        router.push("/login");
      } else {
        const data = await res.json();
        alert(data.message ?? "登録に失敗しました");
      }
    } catch {
      alert("サーバーに接続できませんでした");
    }
  };

  return (
    <AuthCard>
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="名前"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          新規登録
        </button>
      </div>
      <p className="text-center text-xs text-gray-400 mt-6">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="text-blue-500 hover:underline">
          ログイン
        </Link>
      </p>
    </AuthCard>
  );
}
