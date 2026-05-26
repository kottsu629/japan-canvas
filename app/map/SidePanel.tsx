"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import type { City } from "./types";

type Props = {
  prefectureId: number;
  prefectureName: string;
  isVisited: boolean;
  onToggleVisit: (id: number) => void;
  onClose: () => void;
};

export default function SidePanel({
  prefectureId,
  prefectureName,
  isVisited,
  onToggleVisit,
  onClose,
}: Props) {
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/cities?prefecture_id=${prefectureId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setCities(data ?? []));
  }, [prefectureId]);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{prefectureName}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none p-1"
        >
          ✕
        </button>
      </div>

      <button
        onClick={() => onToggleVisit(prefectureId)}
        className={`w-full py-2.5 rounded-lg font-semibold text-white mb-6 transition-colors ${
          isVisited
            ? "bg-gray-400 hover:bg-gray-500"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {isVisited ? "✓ 行った！（解除）" : "行った！"}
      </button>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        おすすめの市
      </p>

      {cities.length === 0 ? (
        <p className="text-gray-400 text-sm">データなし</p>
      ) : (
        <div className="space-y-3">
          {cities.map((city) => (
            <div
              key={city.id}
              className="rounded-xl overflow-hidden border border-gray-100 shadow-sm"
            >
              {city.image_url && (
                <img
                  src={city.image_url}
                  alt={city.name}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-3">
                <p className="font-semibold text-sm">
                  <span className="text-gray-400 mr-1">{city.rank}.</span>
                  {city.name}
                </p>
                {city.affiliate_url && (
                  <a
                    href={city.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-xs mt-1 inline-block hover:underline"
                  >
                    宿泊を探す →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
