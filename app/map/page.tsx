"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import * as topojson from "topojson-client";

type City = {
  id: number;
  prefecture_id: number;
  name: string;
  rank: number;
  image_url: string | null;
  affiliate_url: string | null;
};

export default function MapPage() {
  const router = useRouter();
  useEffect(() => {
    fetch("http://localhost:8080/visits", { credentials: "include" }).then(
      (res) => {
        if (res.status === 401) router.push("/login");
      },
    );
  }, [router]);
  return <JapanMap />;
}

function JapanMap() {
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
    await fetch("http://localhost:8080/visits", {
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
    fetch("http://localhost:8080/visits", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setVisitedIds(
          data.map((v: { prefecture_id: number }) => v.prefecture_id),
        );
      });
  }, []);

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
                  handleMapClick(
                    f.properties?.id,
                    f.properties?.nam_ja ?? "",
                  )
                }
              />
            ))}
          </svg>
        </main>

        {selectedId !== null && (
          <aside className="hidden md:block w-80 border-l bg-white overflow-y-auto shrink-0">
            <SidePanel
              prefectureId={selectedId}
              prefectureName={selectedName}
              isVisited={visitedIds.includes(selectedId)}
              onToggleVisit={handleToggleVisit}
              onClose={() => setSelectedId(null)}
            />
          </aside>
        )}
      </div>

      {selectedId !== null && (
        <div className="md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto z-10">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3" />
          <SidePanel
            prefectureId={selectedId}
            prefectureName={selectedName}
            isVisited={visitedIds.includes(selectedId)}
            onToggleVisit={handleToggleVisit}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}

function SidePanel({
  prefectureId,
  prefectureName,
  isVisited,
  onToggleVisit,
  onClose,
}: {
  prefectureId: number;
  prefectureName: string;
  isVisited: boolean;
  onToggleVisit: (id: number) => void;
  onClose: () => void;
}) {
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    fetch(`http://localhost:8080/cities?prefecture_id=${prefectureId}`, {
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
