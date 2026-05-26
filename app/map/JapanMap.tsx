"use client";

import { useEffect, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import { API_BASE } from "../lib/api";
import SidePanel from "./SidePanel";

export default function JapanMap() {
  const [features, setFeatures] = useState<GeoJSON.Feature[]>([]);
  const [pathGenerator, setPathGenerator] = useState<ReturnType<
    typeof geoPath
  > | null>(null);
  const [visitedIds, setVisitedIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const total = 47;
  const visited = visitedIds.length;
  const percentage = Math.round((visited / total) * 100);

  const handleMapClick = (prefectureId: number, prefectureName: string) => {
    setSelectedId(prefectureId);
    setSelectedName(prefectureName);
  };

  const handleToggleVisit = async (prefectureId: number) => {
    const isVisited = visitedIds.includes(prefectureId);
    await fetch(`${API_BASE}/visits`, {
      method: isVisited ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ prefecture_id: prefectureId }),
    });
    if (isVisited) {
      setVisitedIds((prev) => prev.filter((id) => id !== prefectureId));
    } else {
      setVisitedIds((prev) => [...prev, prefectureId]);
    }
  };

  useEffect(() => {
    fetch("/japan.json")
      .then((res) => res.json())
      .then((topo) => {
        const geo = topojson.feature(
          topo,
          topo.objects.japan,
        ) as unknown as GeoJSON.FeatureCollection;
        const projection = geoMercator().fitSize([600, 700], geo);
        const gen = geoPath().projection(projection);
        setPathGenerator(() => gen);
        setFeatures(geo.features);
      });
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/visits`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setVisitedIds(
          data.map((v: { prefecture_id: number }) => v.prefecture_id),
        );
      });
  }, []);

  const sidePanelProps = selectedId !== null
    ? {
        prefectureId: selectedId,
        prefectureName: selectedName,
        isVisited: visitedIds.includes(selectedId),
        onToggleVisit: handleToggleVisit,
        onClose: () => setSelectedId(null),
      }
    : null;

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold tracking-widest">JAPAN CANVAS</h1>
        <div className="text-sm text-gray-500">
          <span className="font-bold text-gray-900 text-base">{visited}</span>
          <span> / {total} 都道府県 </span>
          <span className="text-blue-600 font-semibold">{percentage}%</span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex-1 min-h-0 min-w-0 flex items-center justify-center p-2 md:p-4">
          <svg viewBox="0 0 600 700" className="max-h-full w-auto">
            {features.map((f, i) => (
              <path
                key={i}
                d={pathGenerator?.(f) ?? ""}
                fill={
                  visitedIds.includes(f.properties?.id)
                    ? "#16a34a"
                    : selectedId === f.properties?.id
                      ? "#f59e0b"
                      : "#bfdbfe"
                }
                stroke="white"
                strokeWidth={0.5}
                className="cursor-pointer hover:opacity-75 transition-opacity"
                onClick={() =>
                  handleMapClick(f.properties?.id, f.properties?.nam_ja ?? "")
                }
              />
            ))}
          </svg>
        </main>

        {sidePanelProps && (
          <aside className="hidden md:block w-80 border-l bg-white overflow-y-auto shrink-0">
            <SidePanel {...sidePanelProps} />
          </aside>
        )}
      </div>

      {sidePanelProps && (
        <div className="md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto z-10">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
          <SidePanel {...sidePanelProps} />
        </div>
      )}
    </div>
  );
}
