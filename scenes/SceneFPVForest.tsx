/** SceneFPVForest — FPV drone flythrough, forest at night.
 *
 *  Phase 8: ORGANIC negative space. No geometric masks, no hole-punched
 *  circles. The "hole" is the natural gap between dense overlapping tree
 *  trunks on the sides, canopy hanging from the top, and ground rolling
 *  from the bottom. Branches and leaves jut INTO the center from both sides,
 *  creating an irregular, organic frame — not a perfect ellipse.
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
    "radial-gradient(ellipse at 50% 42%, #1f3868 0%, #102040 40%, #04091c 100%)",
  fogColor: "rgba(8,16,30,0.55)",
  showStarfield: true,
};

const buildForestCutout = ({
  plateIndex,
  plateCount,
  seed,
  width,
  height,
}: PlateCutoutProps): React.ReactNode => {
  const depth = plateDepth(plateIndex, plateCount);
  const rand = sceneRng(seed);

  // ── Color palette — brighter for far plates so distant rings read
  const canopyColor = depth > 0.5 ? "#1a3020" : "#0a1810";
  const trunkColor = depth > 0.5 ? "#12221a" : "#08120c";
  const groundColor = depth > 0.5 ? "#0e1c14" : "#060e0a";
  const branchColor = depth > 0.5 ? "#16281e" : "#0c1a12";

  // ── Left-side tree trunks (dense wall, x from 0 to ~42% of width)
  const leftWallWidth = width * (0.38 - depth * 0.06); // thicker for near plates
  const leftTrunkCount = 8 + Math.floor((1 - depth) * 5);
  const leftTrunks = Array.from({ length: leftTrunkCount }, (_, i) => {
    const x = rand() * leftWallWidth;
    const w = 50 + rand() * 100 + (1 - depth) * 30;
    const h = height * (0.6 + rand() * 0.45);
    return { x, w, h, canopyRx: w * 1.8 + rand() * 60, canopyRy: w * 1.0 + rand() * 40 };
  });

  // ── Right-side tree trunks
  const rightWallWidth = width * (0.38 - depth * 0.06);
  const rightTrunkCount = 8 + Math.floor((1 - depth) * 5);
  const rightTrunks = Array.from({ length: rightTrunkCount }, (_, i) => {
    const x = width - rightWallWidth + rand() * rightWallWidth;
    const w = 50 + rand() * 100 + (1 - depth) * 30;
    const h = height * (0.6 + rand() * 0.45);
    return { x, w, h, canopyRx: w * 1.8 + rand() * 60, canopyRy: w * 1.0 + rand() * 40 };
  });

  // ── Branches jutting into center from both sides (organic framing)
  const branchCount = 6 + Math.floor((1 - depth) * 4);
  const branches = Array.from({ length: branchCount }, (_, i) => {
    const fromLeft = i % 2 === 0;
    const baseX = fromLeft
      ? leftWallWidth - 40 + rand() * 80
      : width - rightWallWidth - 40 + rand() * 80;
    const tipX = fromLeft
      ? baseX + 100 + rand() * 300
      : baseX - 100 - rand() * 300;
    const y = 80 + rand() * (height * 0.65);
    const thickness = 12 + rand() * 30;
    // Leaf cluster at the tip
    const leafR = 40 + rand() * 80;
    return { baseX, tipX, y, thickness, leafR };
  });

  // ── Canopy across the top — jagged polygon, NO mask
  const canopyBaseY = height * (0.28 - depth * 0.08);
  const canopySamples = 22;
  const canopyPoints: string[] = [`0,0`, `${width},0`];
  for (let i = 0; i <= canopySamples; i++) {
    const x = width - (i / canopySamples) * width;
    const droop = canopyBaseY + Math.sin(i * 1.4 + plateIndex * 2.7) * 50 + rand() * 30;
    canopyPoints.push(`${x.toFixed(0)},${droop.toFixed(0)}`);
  }
  canopyPoints.push(`0,${canopyBaseY.toFixed(0)}`);

  // ── Hanging vine/branch tendrils from the canopy (organic edge)
  const tendrilCount = 5 + Math.floor((1 - depth) * 3);
  const tendrils = Array.from({ length: tendrilCount }, () => {
    const x = 200 + rand() * (width - 400);
    const startY = canopyBaseY + rand() * 60;
    const endY = startY + 80 + rand() * 200;
    const w = 6 + rand() * 14;
    return { x, startY, endY, w };
  });

  // ── Ground rolling from the bottom
  const groundBaseY = height * (0.78 + depth * 0.06);
  const groundSamples = 20;
  const groundPoints: string[] = [`0,${height}`, `${width},${height}`];
  for (let i = 0; i <= groundSamples; i++) {
    const x = width - (i / groundSamples) * width;
    const rise = groundBaseY + Math.sin(i * 1.1 + plateIndex * 1.9) * 30 + rand() * 20 - 10;
    groundPoints.push(`${x.toFixed(0)},${rise.toFixed(0)}`);
  }
  groundPoints.push(`0,${groundBaseY.toFixed(0)}`);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      {/* Canopy ceiling — drawn first, backdrop */}
      <polygon points={canopyPoints.join(" ")} fill={canopyColor} />

      {/* Ground silhouette */}
      <polygon points={groundPoints.join(" ")} fill={groundColor} />

      {/* Left tree wall — trunks + canopies */}
      {leftTrunks.map((t, i) => (
        <g key={`lt-${i}`}>
          <rect x={t.x} y={height - t.h} width={t.w} height={t.h} fill={trunkColor} />
          <ellipse cx={t.x + t.w / 2} cy={height - t.h} rx={t.canopyRx} ry={t.canopyRy} fill={canopyColor} />
        </g>
      ))}

      {/* Right tree wall */}
      {rightTrunks.map((t, i) => (
        <g key={`rt-${i}`}>
          <rect x={t.x} y={height - t.h} width={t.w} height={t.h} fill={trunkColor} />
          <ellipse cx={t.x + t.w / 2} cy={height - t.h} rx={t.canopyRx} ry={t.canopyRy} fill={canopyColor} />
        </g>
      ))}

      {/* Branches jutting into the center — organic framing */}
      {branches.map((b, i) => (
        <g key={`br-${i}`}>
          <line
            x1={b.baseX}
            y1={b.y}
            x2={b.tipX}
            y2={b.y - 20 + rand() * 40}
            stroke={branchColor}
            strokeWidth={b.thickness}
            strokeLinecap="round"
          />
          <ellipse
            cx={b.tipX}
            cy={b.y}
            rx={b.leafR}
            ry={b.leafR * 0.65}
            fill={canopyColor}
          />
        </g>
      ))}

      {/* Hanging tendrils from canopy */}
      {tendrils.map((t, i) => (
        <line
          key={`tend-${i}`}
          x1={t.x}
          y1={t.startY}
          x2={t.x + (rand() - 0.5) * 30}
          y2={t.endY}
          stroke={branchColor}
          strokeWidth={t.w}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
};

// ─── Sub-objects: individual trees + shrubs flying past between plates

const SmallTree: React.FC<{ variant: number; seed: number }> = ({ variant }) => {
  const h = 200 + variant * 60;
  const w = 40 + variant * 12;
  return (
    <svg
      width={w * 3}
      height={h}
      viewBox={`${-w * 1.5} ${-h} ${w * 3} ${h}`}
      style={{ position: "absolute", left: -w * 1.5, top: -h, overflow: "visible" }}
    >
      <rect x={-6} y={-50} width={12} height={50} fill="#08100c" />
      <ellipse cx={0} cy={-50} rx={w} ry={h * 0.35} fill="#0c1a12" />
      <ellipse cx={-w * 0.3} cy={-h * 0.45} rx={w * 0.7} ry={h * 0.25} fill="#0a1810" />
    </svg>
  );
};

const kit: SceneKit = {
  palette,
  buildPlateCutout: buildForestCutout,
  subObjects: [
    {
      Component: SmallTree,
      count: 15,
      xRange: [-800, 800],
      yRange: [100, 350],
    },
  ],
};

export const SceneFPVForest = createFPVScene(kit);
