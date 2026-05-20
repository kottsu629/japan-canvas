"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import * as topojson from "topojson-client";

export default function MapPage() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
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
  const handleClick = async (prefectureId: number) => {
    const token = localStorage.getItem("token");
    const isVisited = visitedIds.includes(prefectureId);

    await fetch("http://localhost:8080/visits", {
      method: isVisited ? "DELETE" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
    const token = localStorage.getItem("token");
    fetch("http://localhost:8080/visits", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setVisitedIds(
          data.map((v: { prefecture_id: number }) => v.prefecture_id),
        );
      });
  }, []);

  return (
    <svg width={600} height={700}>
      {features.map((f, i) => (
        <path
          key={i}
          d={pathGenerator?.(f) ?? ""}
          fill={visitedIds.includes(f.properties?.id) ? "green" : "lightblue"}
          stroke="white"
          strokeWidth={0.5}
          onClick={() => handleClick(f.properties?.id)}
        />
      ))}
    </svg>
  );
}
