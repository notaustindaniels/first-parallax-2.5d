/** SceneFPVCityNight — FPV drone flythrough down a neon-lit night street.
 *
 *  Painted-cutout plate architecture (see SceneFPVForest.tsx for the
 *  explanation). Only the palette and the `buildPlateCutout` function
 *  differ: buildings line the whole frame, the central hole is the
 *  street the drone flies down.
 */
import React from "react";
import {
  type PlateCutoutProps,
  type SceneKit,
  createFPVScene,
  plateDepth,
  sceneRng,
} from "./fpvRecipe";

// ─── SCENE KIT §1 — Palette ─────────────────────────────────────

const palette = {
  backgroundGradient:
    "linear-gradient(180deg, #2a1250 0%, #4a1640 40%, #1a0a28 85%, #05050a 100%)",
  fogColor: "rgba(30,12,48,0.55)",
  showStarfield: false,
};

// ─── SCENE KIT §2 — Cutout paint function ──────────────────────

const buildCityCutout = ({
  plateIndex,
  plateCount,
  seed,
  width,
  height,
}: PlateCutoutProps): React.ReactNode => {
  const depth = plateDepth(plateIndex, plateCount);
  const cx = width / 2;
  const cy = height * 0.58;
  const rand = sceneRng(seed);
  const maskId = `city-hole-${plateIndex}-${seed}`;

  // Hole — a rounded vertical rectangle (the street + sky above)
  const holeW = width * (0.16 + depth * 0.08);
  const holeH = height * (0.32 + depth * 0.08);

  // Deeper plates brighter so distant rings still read against the fog.
  const buildingColor = depth > 0.5 ? "#1a1432" : "#0e0b1a";
  const buildingRoofColor = depth > 0.5 ? "#2a1848" : "#180c28";
  const streetColor = depth > 0.5 ? "#120e22" : "#0a0818";
  const skyslabColor = depth > 0.5 ? "#180e28" : "#0a061c";
  const litColor = "#ffd170";
  const offColor = "#0a0816";
  const neon = "#ff4aa0";

  // Building count — dense across the whole frame
  const buildingCount = 14 + Math.floor((1 - depth) * 8);

  type Building = {
    x: number;
    y: number;
    w: number;
    h: number;
    windowCols: number;
    windowRows: number;
    windowLit: boolean[];
  };

  const buildings: Building[] = [];
  let attempts = 0;
  while (buildings.length < buildingCount && attempts < buildingCount * 4) {
    attempts++;
    const w = 110 + rand() * 200;
    const x = rand() * (width - w);
    // Reject if the building trunk sits across the hole's horizontal span
    const bxMid = x + w / 2;
    if (Math.abs(bxMid - cx) < holeW * 0.42 && rand() > 0.1) continue;

    const h = height * (0.45 + rand() * 0.55);
    const y = height - h;
    const windowCols = 3 + Math.floor(rand() * 3);
    const windowRows = Math.max(6, Math.floor(h / 42));
    const windowLit = Array.from(
      { length: windowCols * windowRows },
      () => rand() > 0.55,
    );
    buildings.push({ x, y, w, h, windowCols, windowRows, windowLit });
  }

  // Foreground flanking buildings — giant, biased to sides
  const flankCount = 4 + Math.floor((1 - depth) * 3);
  const flanks: Building[] = Array.from({ length: flankCount }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const offset = 320 + rand() * (width * 0.3);
    const w = 220 + rand() * 180;
    const x = cx + side * offset - w / 2;
    const h = height * (0.85 + rand() * 0.3);
    const windowCols = 3 + Math.floor(rand() * 3);
    const windowRows = Math.max(10, Math.floor(h / 40));
    const windowLit = Array.from(
      { length: windowCols * windowRows },
      () => rand() > 0.5,
    );
    return { x, y: height - h, w, h, windowCols, windowRows, windowLit };
  });

  // Overhead neon walkway band across the top
  const walkwayDepth = height * (0.22 - depth * 0.08);
  // Street at the bottom
  const streetDepth = height * (0.16 - depth * 0.04);

  const drawBuilding = (b: Building, idx: number, keyPrefix: string) => {
    const colW = (b.w - 22) / b.windowCols;
    const rowH = (b.h - 40) / b.windowRows;
    return (
      <g key={`${keyPrefix}-${idx}`}>
        <rect
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill={buildingColor}
        />
        <rect
          x={b.x - 6}
          y={b.y}
          width={b.w + 12}
          height={10}
          fill={buildingRoofColor}
        />
        {b.windowLit.map((lit, i) => {
          const col = i % b.windowCols;
          const row = Math.floor(i / b.windowCols);
          const wx = b.x + 12 + col * colW;
          const wy = b.y + 22 + row * rowH;
          return (
            <rect
              key={i}
              x={wx}
              y={wy}
              width={Math.max(1, colW - 6)}
              height={Math.max(1, rowH - 6)}
              fill={lit ? litColor : offColor}
              opacity={lit ? 0.94 : 1}
            />
          );
        })}
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <mask id={maskId}>
          <rect x={0} y={0} width={width} height={height} fill="white" />
          <rect
            x={cx - holeW / 2}
            y={cy - holeH / 2}
            width={holeW}
            height={holeH}
            rx={40}
            ry={40}
            fill="black"
          />
          <rect
            x={cx - holeW / 2 - 30}
            y={cy - holeH / 2 - 30}
            width={holeW + 60}
            height={holeH + 60}
            rx={60}
            ry={60}
            fill="black"
            opacity={0.4}
          />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`}>
        {/* Overhead sky slab + neon walkway */}
        <rect x={0} y={0} width={width} height={walkwayDepth * 0.82} fill={skyslabColor} />
        <rect
          x={0}
          y={walkwayDepth * 0.82}
          width={width}
          height={walkwayDepth * 0.12}
          fill={buildingRoofColor}
        />
        <rect
          x={60}
          y={walkwayDepth * 0.95}
          width={width - 120}
          height={5}
          fill={neon}
          opacity={0.95}
        />
        <rect
          x={60}
          y={walkwayDepth * 0.95}
          width={width - 120}
          height={22}
          fill={neon}
          opacity={0.18}
        />

        {/* Street gutter */}
        <rect
          x={0}
          y={height - streetDepth}
          width={width}
          height={streetDepth}
          fill={streetColor}
        />
        <rect
          x={0}
          y={height - streetDepth - 5}
          width={width}
          height={5}
          fill="#2a1a3a"
        />

        {/* Background buildings — full-width distribution */}
        {buildings.map((b, i) => drawBuilding(b, i, "bg"))}

        {/* Foreground flanking buildings — drawn last, dominate sides */}
        {flanks.map((b, i) => drawBuilding(b, i, "fg"))}
      </g>
    </svg>
  );
};

// ─── Assemble the kit and produce the scene ─────────────────────

const kit: SceneKit = {
  palette,
  buildPlateCutout: buildCityCutout,
};

export const SceneFPVCityNight = createFPVScene(kit);
