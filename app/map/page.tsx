"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../lib/api";
import JapanMap from "./JapanMap";

export default function MapPage() {
  const router = useRouter();
  useEffect(() => {
    fetch(`${API_BASE}/visits`, { credentials: "include" }).then((res) => {
      if (res.status === 401) router.push("/login");
    });
  }, [router]);
  return <JapanMap />;
}
