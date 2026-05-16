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
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    fetch("/japan.json")
      .then((res) => res.json())
      .then((topo) => {
        const geo = topojson.feature(
          topo,
          topo.objects.japan,
        ) as unknown as GeoJSON.FeatureCollection;
        const projection = geoMercator().fitSize([600, 700], geo);
        const pathGenerator = geoPath().projection(projection);
        const d = geo.features.map((f) => pathGenerator(f) ?? "");
        setPaths(d);
      });
  }, []);

  return (
    <svg width={600} height={700}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="lightblue" stroke="white" strokeWidth={0.5} />
      ))}
    </svg>
  );
}
