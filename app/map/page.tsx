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
  return (
    <div>
      <h1>地図</h1>
      <JapanMap />
    </div>
  );
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
    <div style={{ display: "flex", gap: 24 }}>
      <div>
        <p>
          {visited} / {total} 都道府県 ({percentage}%)
        </p>
        <svg width={600} height={700}>
          {features.map((f, i) => (
            <path
              key={i}
              d={pathGenerator?.(f) ?? ""}
              fill={
                visitedIds.includes(f.properties?.id)
                  ? "green"
                  : selectedId === f.properties?.id
                    ? "#f0a500"
                    : "lightblue"
              }
              stroke="white"
              strokeWidth={0.5}
              style={{ cursor: "pointer" }}
              onClick={() =>
                handleMapClick(
                  f.properties?.id,
                  f.properties?.nam_ja ?? "",
                )
              }
            />
          ))}
        </svg>
      </div>
      {selectedId !== null && (
        <SidePanel
          prefectureId={selectedId}
          prefectureName={selectedName}
          isVisited={visitedIds.includes(selectedId)}
          onToggleVisit={handleToggleVisit}
          onClose={() => setSelectedId(null)}
        />
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
    <div
      style={{
        width: 280,
        borderLeft: "1px solid #ccc",
        paddingLeft: 16,
        overflowY: "auto",
        maxHeight: 700,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>{prefectureName}</h2>
        <button onClick={onClose}>✕</button>
      </div>
      <button
        onClick={() => onToggleVisit(prefectureId)}
        style={{
          backgroundColor: isVisited ? "#aaa" : "green",
          color: "white",
          padding: "8px 16px",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          marginBottom: 16,
          width: "100%",
        }}
      >
        {isVisited ? "行った！（解除）" : "行った！"}
      </button>
      <h3>おすすめの市</h3>
      {cities.length === 0 ? (
        <p>データなし</p>
      ) : (
        cities.map((city) => (
          <div key={city.id} style={{ marginBottom: 16 }}>
            <p style={{ fontWeight: "bold" }}>
              {city.rank}. {city.name}
            </p>
            {city.image_url && (
              <img
                src={city.image_url}
                alt={city.name}
                style={{ width: "100%", borderRadius: 4 }}
              />
            )}
            {city.affiliate_url && (
              <a
                href={city.affiliate_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                宿泊を探す →
              </a>
            )}
          </div>
        ))
      )}
    </div>
  );
}
