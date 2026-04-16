/** SceneFPVCityNight — FPV drone flythrough down a neon-lit city canyon.
 *
 *  Phase 8: ORGANIC negative space. The "hole" is the V/U shaped sky gap
 *  between building silhouettes of varying heights. No geometric masks.
 *  Skyscrapers on both sides, walkway overhead, street gutter below.
 */
import React from "react";
import {
  type PlateCutoutProps,
  type SceneKit,
  createFPVScene,
  plateDepth,
  sceneRng,
} from "./fpvRecipe";

const palette = {
  backgroundGradient:
    "linear-gradient(180deg, #2a1250 0%, #4a1640 40%, #1a0a28 85%, #05050a 100%)",
  fogColor: "rgba(30,12,48,0.55)",
  showStarfield: false,
};

const buildCityCutout = ({
  plateIndex,
  plateCount,
  seed,
  width,
  height,
}: PlateCutoutProps): React.ReactNode => {
  const depth = plateDepth(plateIndex, plateCount);
  const rand = sceneRng(seed);
  const cx = width / 2;

  const buildingColor = depth > 0.5 ? "#1a1432" : "#0e0b1a";
  const roofColor = depth > 0.5 ? "#2a1848" : "#180c28";
  const litColor = "#ffd170";
  const offColor = "#0a0816";
  const neon = "#ff4aa0";
  const streetColor = depth > 0.5 ? "#120e22" : "#080618";
  const skyslabColor = depth > 0.5 ? "#180e28" : "#0a061c";

  // ── Left wall: cluster of buildings with varying heights, forming
  //    the left side of the V-canyon
  const leftWallWidth = width * (0.40 - depth * 0.06);
  const leftBuildingCount = 6 + Math.floor((1 - depth) * 4);
  const leftBuildings = Array.from({ length: leftBuildingCount }, () => {
    const w = 80 + rand() * 180;
    const x = rand() * leftWallWidth;
    const h = height * (0.35 + rand() * 0.6 + (1 - depth) * 0.1);
    const windowCols = 2 + Math.floor(rand() * 3);
    const windowRows = Math.max(5, Math.floor(h / 48));
    return { x, w, h, windowCols, windowRows, lit: Array.from({ length: windowCols * windowRows }, () => rand() > 0.5) };
  });

  // ── Right wall
  const rightWallWidth = width * (0.40 - depth * 0.06);
  const rightBuildingCount = 6 + Math.floor((1 - depth) * 4);
  const rightBuildings = Array.from({ length: rightBuildingCount }, () => {
    const w = 80 + rand() * 180;
    const x = width - rightWallWidth + rand() * (rightWallWidth - w);
    const h = height * (0.35 + rand() * 0.6 + (1 - depth) * 0.1);
    const windowCols = 2 + Math.floor(rand() * 3);
    const windowRows = Math.max(5, Math.floor(h / 48));
    return { x, w, h, windowCols, windowRows, lit: Array.from({ length: windowCols * windowRows }, () => rand() > 0.5) };
  });

  // ── Walkway / bridge overhead — a structural span across the top portion
  const walkwayTop = height * (0.06 + depth * 0.04);
  const walkwayBottom = walkwayTop + height * (0.12 - depth * 0.03);

  // ── Street gutter at the bottom
  const streetTop = height * (0.84 + depth * 0.04);

  // ── Antenna / crane / sign jutting into center from building tops
  const jutCount = 3 + Math.floor((1 - depth) * 3);
  const juts = Array.from({ length: jutCount }, (_, i) => {
    const fromLeft = i % 2 === 0;
    const baseX = fromLeft
      ? leftWallWidth - 30 + rand() * 60
      : width - rightWallWidth - 30 + rand() * 60;
    const tipX = fromLeft ? baseX + 80 + rand() * 200 : baseX - 80 - rand() * 200;
    const y = walkwayBottom + 30 + rand() * (height * 0.35);
    return { baseX, tipX, y, w: 5 + rand() * 10 };
  });

  const drawBuilding = (b: typeof leftBuildings[0], idx: number, prefix: string) => {
    const colW = (b.w - 16) / b.windowCols;
    const rowH = (b.h - 30) / b.windowRows;
    return (
      <g key={`${prefix}-${idx}`}>
        <rect x={b.x} y={height - b.h} width={b.w} height={b.h} fill={buildingColor} />
        <rect x={b.x - 4} y={height - b.h} width={b.w + 8} height={8} fill={roofColor} />
        {b.lit.map((lit, i) => {
          const col = i % b.windowCols;
          const row = Math.floor(i / b.windowCols);
          return (
            <rect
              key={i}
              x={b.x + 8 + col * colW}
              y={height - b.h + 16 + row * rowH}
              width={Math.max(1, colW - 5)}
              height={Math.max(1, rowH - 5)}
              fill={lit ? litColor : offColor}
              opacity={lit ? 0.92 : 1}
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
      {/* Walkway overhead — NO mask, just a band across the top */}
      <rect x={0} y={0} width={width} height={walkwayTop} fill={skyslabColor} />
      <rect x={0} y={walkwayTop} width={width} height={walkwayBottom - walkwayTop} fill={roofColor} opacity={0.7} />
      {/* Neon strip under walkway */}
      <rect x={100} y={walkwayBottom - 5} width={width - 200} height={4} fill={neon} opacity={0.95} />
      <rect x={100} y={walkwayBottom - 5} width={width - 200} height={18} fill={neon} opacity={0.18} />

      {/* But the walkway should NOT cover the center canyon — clear the middle */}
      <rect
        x={leftWallWidth}
        y={0}
        width={width - leftWallWidth - rightWallWidth}
        height={walkwayBottom}
        fill="transparent"
      />

      {/* Street gutter */}
      <rect x={0} y={streetTop} width={width} height={height - streetTop} fill={streetColor} />
      <rect x={0} y={streetTop - 4} width={width} height={4} fill="#2a1a3a" />

      {/* Left building wall */}
      {leftBuildings.map((b, i) => drawBuilding(b, i, "lb"))}

      {/* Right building wall */}
      {rightBuildings.map((b, i) => drawBuilding(b, i, "rb"))}

      {/* Structural elements jutting into center — cranes, antennas, signs */}
      {juts.map((j, i) => (
        <g key={`jut-${i}`}>
          <line x1={j.baseX} y1={j.y} x2={j.tipX} y2={j.y - 10 + rand() * 20}
            stroke={roofColor} strokeWidth={j.w} strokeLinecap="round" />
          {/* Small neon sign at the tip */}
          <rect x={j.tipX - 15} y={j.y - 18} width={30} height={12} fill={neon} opacity={0.6} />
        </g>
      ))}
    </svg>
  );
};

// ─── Sub-objects: streetlights, cars, telephone wires between plates

import { interpolate } from "remotion";

const Streetlight: React.FC<{ variant: number; seed: number }> = ({ variant }) => {
  const h = 260 + variant * 40;
  return (
    <svg
      width={80}
      height={h}
      viewBox={`-40 ${-h} 80 ${h}`}
      style={{ position: "absolute", left: -40, top: -h, overflow: "visible" }}
    >
      <rect x={-3} y={-h + 30} width={6} height={h - 30} fill="#2a2430" />
      <rect x={-1} y={-h + 24} width={22} height={4} fill="#2a2430" />
      <circle cx={20} cy={-h + 30} r={30} fill="#ffc060" opacity={0.18} />
      <circle cx={20} cy={-h + 30} r={14} fill="#ffd480" opacity={0.6} />
      <circle cx={20} cy={-h + 30} r={6} fill="#fff5c8" opacity={0.95} />
    </svg>
  );
};

const Car: React.FC<{ variant: number; seed: number }> = ({ variant }) => {
  const w = 100 + variant * 20;
  const h = 40 + variant * 8;
  const bodyColor = ["#8a2020", "#2020a0", "#c0c020", "#20a040"][variant % 4];
  return (
    <svg
      width={w}
      height={h}
      viewBox={`${-w / 2} ${-h} ${w} ${h}`}
      style={{ position: "absolute", left: -w / 2, top: -h, overflow: "visible" }}
    >
      <rect x={-w / 2} y={-h} width={w} height={h * 0.65} rx={6} fill={bodyColor} />
      <rect x={-w / 2 + 8} y={-h * 0.35} width={w - 16} height={h * 0.35} fill={bodyColor} opacity={0.7} />
      {/* Headlights */}
      <circle cx={-w / 2 + 10} cy={-h * 0.5} r={6} fill="#ffee80" opacity={0.9} />
      <circle cx={w / 2 - 10} cy={-h * 0.5} r={5} fill="#ff3020" opacity={0.7} />
    </svg>
  );
};

// Camera swoop: start high (above telephone wires), dive toward the road
const cityCameraSwoop = (panProgress: number): number => {
  // Start 300px above center (above wires), swoop down to 200px below (street level)
  const swoopCurve = panProgress * panProgress; // ease-in: slow start, fast dive
  return interpolate(swoopCurve, [0, 1], [-300, 200]);
};

const kit: SceneKit = {
  palette,
  buildPlateCutout: buildCityCutout,
  subObjects: [
    {
      Component: Streetlight,
      count: 12,
      xRange: [-600, 600],  // scattered across the street canyon
      yRange: [-100, 200],  // above and at ground level
    },
    {
      Component: Car,
      count: 10,
      xRange: [-400, 400],  // on the road
      yRange: [250, 400],   // below camera, on the street
    },
  ],
  cameraYOverride: cityCameraSwoop,
};

export const SceneFPVCityNight = createFPVScene(kit);
