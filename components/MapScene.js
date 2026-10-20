"use client";
import { useEffect, useRef, useState } from "react";
const maps = new Map();
function loadMap(key) {
  if (!maps.has(key))
    maps.set(
      key,
      fetch(`/maps/${key}.json`, { cache: "force-cache" })
        .then((r) => {
          if (!r.ok) throw Error("The map could not load. Please retry.");
          return r.json();
        })
        .catch((e) => {
          maps.delete(key);
          throw e;
        }),
    );
  return maps.get(key);
}
const colors = ["#df8d40", "#9066b7", "#4e9c7c", "#508eb0"];
export default function MapScene({ map, onAnswer, disabled = false, caption }) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [zoom, setZoom] = useState(1),
    [width, setWidth] = useState(800),
    [retry, setRetry] = useState(0);
  const frame = useRef(null);
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    setZoom(1);
    loadMap(map.key)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [map.key, retry]);
  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setWidth(node.clientWidth));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const radius = data
    ? Math.max(18, (22 * data.width) / (Math.max(200, width) * zoom))
    : 22;
  const markers = [];
  for (const [index, id] of (map.choices || []).entries()) {
    const shape = data?.shapes.find((s) => s.id === id);
    if (!shape) continue;
    let [x, y] = shape.point;
    x = Math.max(radius + 5, Math.min((data?.width || 1000) - radius - 5, x));
    y = Math.max(radius + 5, Math.min((data?.height || 590) - radius - 5, y));
    for (let attempt = 0; attempt < 12; attempt++) {
      if (markers.every((m) => Math.hypot(m.x - x, m.y - y) > radius * 2.2))
        break;
      const direction = index % 2 ? 1 : -1;
      y = Math.max(
        radius + 5,
        Math.min(data.height - radius - 5, y + direction * radius * 2.3),
      );
      if (attempt > 4)
        x = Math.max(
          radius + 5,
          Math.min(data.width - radius - 5, x + radius * 2.2),
        );
    }
    markers.push({ id, index, x, y, anchor: shape.point });
  }
  const choose = (index) => {
    if (!disabled && onAnswer) onAnswer(String(index));
  };
  return (
    <div className="atlas-scene">
      <div className="atlas-controls">
        <span>🧭 North is up</span>
        <div>
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoom <= 1}
            onClick={() => setZoom((z) => z - 0.5)}
          >
            −
          </button>
          <span>{zoom}×</span>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoom >= 3}
            onClick={() => setZoom((z) => z + 0.5)}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              frame.current?.scrollTo({ top: 0, left: 0 });
            }}
          >
            Fit map
          </button>
        </div>
      </div>
      <div className="atlas-viewport" ref={frame}>
        {!data && !error && <p role="status">Opening your map…</p>}
        {error && (
          <p role="alert">
            {error}{" "}
            <button onClick={() => setRetry((n) => n + 1)}>Retry map</button>
          </p>
        )}
        {data && (
          <svg
            viewBox={`0 0 ${data.width} ${data.height}`}
            style={{ width: `${zoom * 100}%` }}
            role={onAnswer ? "group" : "img"}
            aria-label={
              caption ||
              "Learning map. Highlighted shapes and numbered choices show places."
            }
          >
            <rect width={data.width} height={data.height} fill="#e1f0f3" />
            {data.shapes.map((shape, i) => {
              const choice = (map.choices || []).indexOf(shape.id),
                selected = map.highlight === shape.id;
              return (
                <path
                  key={`${shape.id}-${i}`}
                  d={shape.d}
                  fill={
                    selected
                      ? "#edac4f"
                      : choice >= 0
                        ? colors[choice % 4]
                        : "#b6cfba"
                  }
                  stroke={selected || choice >= 0 ? "#34554b" : "#f6faf1"}
                  strokeWidth={selected || choice >= 0 ? 2 : 0.7}
                  vectorEffect="non-scaling-stroke"
                  aria-hidden="true"
                  onClick={choice >= 0 ? () => choose(choice) : undefined}
                  style={choice >= 0 ? { cursor: "pointer" } : undefined}
                />
              );
            })}
            {map.key === "states" && (
              <g fill="#3e5f60" fontSize="17" aria-hidden="true">
                <text x="150" y="589">
                  Alaska inset
                </text>
                <text x="352" y="589">
                  Hawaii inset
                </text>
              </g>
            )}
            {markers.map((m) => (
              <g
                key={m.id}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-label={`Map choice ${m.index + 1}`}
                aria-disabled={disabled}
                onClick={() => choose(m.index)}
                onKeyDown={(e) => {
                  if (["Enter", " "].includes(e.key)) {
                    e.preventDefault();
                    choose(m.index);
                  }
                }}
                className="atlas-marker"
              >
                <line
                  x1={m.x}
                  y1={m.y}
                  x2={m.anchor[0]}
                  y2={m.anchor[1]}
                  stroke="#263f3d"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={m.anchor[0]}
                  cy={m.anchor[1]}
                  r="4"
                  fill="#263f3d"
                />
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={radius}
                  fill={colors[m.index % 4]}
                  stroke="#fffdf4"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={m.x}
                  y={m.y}
                  dy=".35em"
                  textAnchor="middle"
                  fill="white"
                  fontWeight="900"
                  fontSize={radius * 1.1}
                >
                  {m.index + 1}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>
      <p className="atlas-map-caption">
        {caption ||
          ((map.choices || []).length
            ? "Tap a numbered shape, or choose its number below. Zoom in and slide the map for a closer look."
            : "Look at the golden shape. Zoom in and slide the map for a closer look.")}
      </p>
      <small>
        Learning map · simplified boundaries
        {map.key === "states"
          ? " · Alaska and Hawaii are moved and resized to fit"
          : " · Made with Natural Earth"}
      </small>
    </div>
  );
}
