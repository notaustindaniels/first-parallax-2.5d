/** SceneFPVForest — FPV drone flythrough, forest at night.
 *
 *  Phase 11 upgrades:
 *  - Higher-fidelity silhouette sub-objects (SmallTree now has multi-layered
 *    canopy mass, visible branching, and a moonlit rim-light).
 *  - Added fog puffs for volumetric atmosphere.
 *  - Near-cull in fpvRecipe now eliminates the pop-through artifacts
 *    that used to happen when sub-objects passed the lens.
 *
 *  NOTE: the "portal" concept lives in SceneFPVForestToCity, not here.
 *  This scene is the clean, standalone forest flythrough.
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

  const canopyColor = depth > 0.5 ? "#1a3020" : "#0a1810";
  const trunkColor = depth > 0.5 ? "#12221a" : "#08120c";
  const groundColor = depth > 0.5 ? "#0e1c14" : "#060e0a";
  const branchColor = depth > 0.5 ? "#16281e" : "#0c1a12";

  const leftWallWidth = width * (0.38 - depth * 0.06);
  const leftTrunkCount = 8 + Math.floor((1 - depth) * 5);
  const leftTrunks = Array.from({ length: leftTrunkCount }, () => {
    const x = rand() * leftWallWidth;
    const w = 50 + rand() * 100 + (1 - depth) * 30;
    const h = height * (0.6 + rand() * 0.45);
    return {
      x,
      w,
      h,
      canopyRx: w * 1.8 + rand() * 60,
      canopyRy: w * 1.0 + rand() * 40,
    };
  });

  const rightWallWidth = width * (0.38 - depth * 0.06);
  const rightTrunkCount = 8 + Math.floor((1 - depth) * 5);
  const rightTrunks = Array.from({ length: rightTrunkCount }, () => {
    const x = width - rightWallWidth + rand() * rightWallWidth;
    const w = 50 + rand() * 100 + (1 - depth) * 30;
    const h = height * (0.6 + rand() * 0.45);
    return {
      x,
      w,
      h,
      canopyRx: w * 1.8 + rand() * 60,
      canopyRy: w * 1.0 + rand() * 40,
    };
  });

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
    const leafR = 40 + rand() * 80;
    return { baseX, tipX, y, thickness, leafR };
  });

  const canopyBaseY = height * (0.28 - depth * 0.08);
  const canopySamples = 22;
  const canopyPoints: string[] = [`0,0`, `${width},0`];
  for (let i = 0; i <= canopySamples; i++) {
    const x = width - (i / canopySamples) * width;
    const droop =
      canopyBaseY + Math.sin(i * 1.4 + plateIndex * 2.7) * 50 + rand() * 30;
    canopyPoints.push(`${x.toFixed(0)},${droop.toFixed(0)}`);
  }
  canopyPoints.push(`0,${canopyBaseY.toFixed(0)}`);

  const tendrilCount = 5 + Math.floor((1 - depth) * 3);
  const tendrils = Array.from({ length: tendrilCount }, () => {
    const x = 200 + rand() * (width - 400);
    const startY = canopyBaseY + rand() * 60;
    const endY = startY + 80 + rand() * 200;
    const w = 6 + rand() * 14;
    return { x, startY, endY, w };
  });

  const groundBaseY = height * (0.78 + depth * 0.06);
  const groundSamples = 20;
  const groundPoints: string[] = [`0,${height}`, `${width},${height}`];
  for (let i = 0; i <= groundSamples; i++) {
    const x = width - (i / groundSamples) * width;
    const rise =
      groundBaseY + Math.sin(i * 1.1 + plateIndex * 1.9) * 30 + rand() * 20 - 10;
    groundPoints.push(`${x.toFixed(0)},${rise.toFixed(0)}`);
  }
  groundPoints.push(`0,${groundBaseY.toFixed(0)}`);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <polygon points={canopyPoints.join(" ")} fill={canopyColor} />
      <polygon points={groundPoints.join(" ")} fill={groundColor} />

      {leftTrunks.map((t, i) => (
        <g key={`lt-${i}`}>
          <rect x={t.x} y={height - t.h} width={t.w} height={t.h} fill={trunkColor} />
          <ellipse
            cx={t.x + t.w / 2}
            cy={height - t.h}
            rx={t.canopyRx}
            ry={t.canopyRy}
            fill={canopyColor}
          />
        </g>
      ))}

      {rightTrunks.map((t, i) => (
        <g key={`rt-${i}`}>
          <rect x={t.x} y={height - t.h} width={t.w} height={t.h} fill={trunkColor} />
          <ellipse
            cx={t.x + t.w / 2}
            cy={height - t.h}
            rx={t.canopyRx}
            ry={t.canopyRy}
            fill={canopyColor}
          />
        </g>
      ))}

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

// ─── Sub-objects ───────────────────────────────────────────────

const SmallTree: React.FC<{ variant: number; seed: number }> = ({
  variant,
  seed,
}) => {
  const h = 220 + variant * 70;
  const w = 55 + variant * 14;
  const r = sceneRng(seed);

  const branches = Array.from({ length: 4 + variant }, () => ({
    angle: (r() - 0.5) * 1.2,
    length: h * (0.15 + r() * 0.25),
    y: -h * (0.2 + r() * 0.5),
    width: 4 + r() * 4,
  }));

  return (
    <svg
      width={w * 4}
      height={h + 40}
      viewBox={`${-w * 2} ${-h - 20} ${w * 4} ${h + 40}`}
      style={{
        position: "absolute",
        left: -w * 2,
        top: -h - 20,
        overflow: "visible",
        filter: "drop-shadow(0 0 2px rgba(180,210,255,0.15))",
      }}
    >
      <ellipse cx={0} cy={-4} rx={w * 0.9} ry={6} fill="#020604" opacity={0.6} />
      <path d={`M ${-8} 0 L ${-5} ${-h * 0.6} L 5 ${-h * 0.6} L 8 0 Z`} fill="#060c08" />
      {branches.map((b, i) => (
        <line
          key={i}
          x1={0}
          y1={b.y}
          x2={Math.sin(b.angle) * b.length}
          y2={b.y - Math.abs(Math.cos(b.angle)) * b.length * 0.5}
          stroke="#070e0a"
          strokeWidth={b.width}
          strokeLinecap="round"
        />
      ))}
      <ellipse cx={-w * 0.35} cy={-h * 0.55} rx={w * 0.85} ry={h * 0.22} fill="#0a1410" />
      <ellipse cx={w * 0.3} cy={-h * 0.5} rx={w * 0.8} ry={h * 0.24} fill="#0c1812" />
      <ellipse cx={0} cy={-h * 0.75} rx={w * 1.15} ry={h * 0.3} fill="#0e1a14" />
      <path
        d={`M ${-w * 1.1} ${-h * 0.75} Q ${-w * 0.8} ${-h * 1.05} ${0} ${-h * 1.02} Q ${w * 0.8} ${-h * 1.0} ${w * 1.1} ${-h * 0.75}`}
        fill="none"
        stroke="#2a3f4a"
        strokeWidth={2}
        opacity={0.5}
      />
    </svg>
  );
};

const FogPuff: React.FC<{ variant: number; seed: number }> = ({
  variant,
  seed,
}) => {
  const r = sceneRng(seed);
  const size = 180 + variant * 80;
  return (
    <div
      style={{
        position: "absolute",
        left: -size / 2,
        top: -size / 2,
        width: size,
        height: size,
        background: `radial-gradient(ellipse at ${30 + r() * 40}% 50%, rgba(180,200,230,0.12) 0%, rgba(120,150,200,0.05) 40%, rgba(0,0,0,0) 70%)`,
        filter: "blur(6px)",
      }}
    />
  );
};

const kit: SceneKit = {
  palette,
  buildPlateCutout: buildForestCutout,
  subObjects: [
    {
      Component: SmallTree,
      count: 18,
      xRange: [-800, 800],
      yRange: [100, 350],
    },
    {
      Component: FogPuff,
      count: 8,
      xRange: [-600, 600],
      yRange: [-100, 300],
    },
  ],
};

export const SceneFPVForest = createFPVScene(kit);
export const forestKit = kit;

/** The portal-plate SVG builder, exported so the transition scene can
 *  render a dedicated portal plate as its own CSS 3D layer. */
export const buildPortalPlate = (
  seed: number,
  width: number,
  height: number,
): React.ReactNode => {
  const rand = sceneRng(seed);
  const cx = width / 2;
  const cy = height * 0.48;

  const samples = 14;
  // Larger hole — ~25% of short axis — reads as a clear window
  // through the foliage rather than a decorative spot.
  const baseR = Math.min(width, height) * 0.25;
  const ringPts: Array<[number, number]> = [];
  for (let i = 0; i < samples; i++) {
    const a = (i / samples) * Math.PI * 2;
    const r = baseR * (0.8 + rand() * 0.45);
    ringPts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }

  const buildSmoothClosed = (pts: Array<[number, number]>): string => {
    const mid = (a: [number, number], b: [number, number]): [number, number] => [
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
    ];
    const first = mid(pts[pts.length - 1], pts[0]);
    let d = `M ${first[0].toFixed(1)},${first[1].toFixed(1)} `;
    for (let i = 0; i < pts.length; i++) {
      const curr = pts[i];
      const next = pts[(i + 1) % pts.length];
      const m = mid(curr, next);
      d += `Q ${curr[0].toFixed(1)},${curr[1].toFixed(1)} ${m[0].toFixed(1)},${m[1].toFixed(1)} `;
    }
    d += "Z";
    return d;
  };

  const holePath = buildSmoothClosed(ringPts);

  const fringeLeaves = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2 + rand() * 0.2;
    const r = baseR * (1.02 + rand() * 0.25);
    const lx = cx + Math.cos(a) * r;
    const ly = cy + Math.sin(a) * r;
    const rot = (a * 180) / Math.PI + 90 + (rand() - 0.5) * 40;
    const lw = 30 + rand() * 40;
    const lh = 60 + rand() * 50;
    return { lx, ly, rot, lw, lh };
  });

  const branchArms = Array.from({ length: 5 }, () => {
    const a = rand() * Math.PI * 2;
    const outerR = Math.max(width, height) * 0.7;
    const ox = cx + Math.cos(a) * outerR;
    const oy = cy + Math.sin(a) * outerR;
    const innerR = baseR * (1.1 + rand() * 0.4);
    const ix = cx + Math.cos(a) * innerR;
    const iy = cy + Math.sin(a) * innerR;
    const thickness = 24 + rand() * 30;
    return { ox, oy, ix, iy, thickness };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      {/* Foliage wall — lightened to #0e1c14 so the silhouette reads
          against a near-black night sky (was #04090e, invisible on
          the black backdrop). Outside the hole = solid foliage. */}
      <path
        d={`M 0,0 L ${width},0 L ${width},${height} L 0,${height} Z ${holePath}`}
        fill="#0e1c14"
        fillRule="evenodd"
      />

      {/* Thick branch arms radiating toward the hole — brighter so
          they're visible as silhouetted branches, not just black. */}
      {branchArms.map((b, i) => (
        <line
          key={`arm-${i}`}
          x1={b.ox}
          y1={b.oy}
          x2={b.ix}
          y2={b.iy}
          stroke="#0a1410"
          strokeWidth={b.thickness}
          strokeLinecap="round"
        />
      ))}

      {/* Leaf fringe around the hole — readable dusky green so the
          organic "hole in foliage" edge sells itself. */}
      {fringeLeaves.map((f, i) => (
        <ellipse
          key={`fringe-${i}`}
          cx={f.lx}
          cy={f.ly}
          rx={f.lw / 2}
          ry={f.lh / 2}
          fill="#16281e"
          transform={`rotate(${f.rot} ${f.lx} ${f.ly})`}
        />
      ))}

      {/* Moonlit rim-light around the hole — a thin outline on the
          hole's perimeter, faintly catching ambient sky light. Sells
          the "looking through an opening" depth cue. */}
      <path
        d={holePath}
        fill="none"
        stroke="#2a3f4a"
        strokeWidth={3}
        opacity={0.45}
      />
    </svg>
  );
};
