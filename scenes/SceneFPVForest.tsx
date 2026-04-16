/** SceneFPVForest — FPV drone flythrough, forest at night.
 *
 *  Architecture: painted cutout plates. Each plate is ONE full-frame
 *  SVG painting with dense tree silhouettes everywhere and a small
 *  transparent hole at the center. The plate's outer div is 300vw ×
 *  300vh so at translateZ(0) the painting overflows the viewport and
 *  the viewer sees only its central region; at deep negative Z the
 *  whole painting shrinks to a small ring framing the static sky.
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
    "radial-gradient(ellipse at 50% 42%, #1f3868 0%, #102040 40%, #04091c 100%)",
  fogColor: "rgba(8,16,30,0.55)",
  showStarfield: true,
};

// ─── SCENE KIT §2 — Cutout paint function ──────────────────────
// Paints dense tree silhouettes across the whole SVG with a tight
// central hole. Deeper plates get slightly less density and a larger
// hole so they read as "distant rings" through the tunnel.

const buildForestCutout = ({
  plateIndex,
  plateCount,
  seed,
  width,
  height,
}: PlateCutoutProps): React.ReactNode => {
  const depth = plateDepth(plateIndex, plateCount);
  const cx = width / 2;
  const cy = height * 0.52;
  const rand = sceneRng(seed);

  // Hole size — smaller on near plates (claustrophobic), larger on
  // distant plates (opens up into the tunnel).
  const holeW = width * (0.14 + depth * 0.08);
  const holeH = height * (0.18 + depth * 0.08);

  const maskId = `forest-hole-${plateIndex}-${seed}`;

  // Total tree count across the full frame.
  const treeCount = 18 + Math.floor((1 - depth) * 8);

  type Tree = {
    x: number;
    baseY: number;
    w: number;
    h: number;
    canopyR: number;
    flipped: boolean;
  };

  // Distribute trees across the whole width. Nudge them away from the
  // central hole so the opening stays clear — but still allow some to
  // overlap the hole perimeter for an organic edge.
  const trees: Tree[] = [];
  let attempts = 0;
  while (trees.length < treeCount && attempts < treeCount * 4) {
    attempts++;
    const x = rand() * width;
    // Distance from the center of the hole (horizontally only — the
    // y-position is always ground-anchored).
    const distFromHoleCenterX = Math.abs(x - cx);
    // Reject trees whose trunk would hit the hole, unless they're
    // short enough that the canopy doesn't reach the hole ceiling.
    if (distFromHoleCenterX < holeW * 0.38 && rand() > 0.15) continue;

    const hBase = 360 + rand() * 380;
    const w = 56 + rand() * 80;
    const baseY = height - 40 + rand() * 40;
    trees.push({
      x,
      baseY,
      w,
      h: hBase,
      canopyR: w * 2.2 + rand() * 30,
      flipped: rand() > 0.5,
    });
  }

  // Foreground tree clusters — bigger, drawn on top, biased to sides
  // so they form the edge of the vignette even when the plate is close.
  const foregroundClusterCount = 4 + Math.floor((1 - depth) * 3);
  const clusters: Tree[] = Array.from(
    { length: foregroundClusterCount },
    (_, i) => {
      const sideSign = i % 2 === 0 ? -1 : 1;
      const horizOffset = 200 + rand() * (width * 0.35);
      const x = cx + sideSign * horizOffset;
      return {
        x,
        baseY: height - 20 + rand() * 20,
        w: 120 + rand() * 100,
        h: 700 + rand() * 260,
        canopyR: 260 + rand() * 120,
        flipped: false,
      };
    },
  );

  // Canopy ceiling — a wavy polygon along the top of the SVG
  const canopyDepth = height * (0.32 - depth * 0.1);
  const canopyPts: string[] = [`0,0`, `${width},0`];
  const samples = 26;
  for (let i = 0; i <= samples; i++) {
    const x = width - (i / samples) * width;
    // Avoid dipping into the hole
    const distanceToHole = Math.max(0, holeH / 2 - Math.abs(cy - canopyDepth));
    const base = canopyDepth + Math.sin(i * 0.8 + plateIndex * 2.3) * 40;
    const y = Math.max(0, base - distanceToHole * 0.2 + rand() * 30 - 15);
    canopyPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  canopyPts.push(`0,0`);

  // Ground silhouette — along the bottom
  const groundDepth = height * (0.22 - depth * 0.08);
  const groundTop = height - groundDepth;
  const groundPts: string[] = [`0,${height}`, `${width},${height}`];
  for (let i = 0; i <= samples; i++) {
    const x = width - (i / samples) * width;
    const y =
      groundTop +
      Math.sin(i * 0.9 + plateIndex * 1.7) * 24 +
      rand() * 18 -
      9;
    groundPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  groundPts.push(`0,${height}`);

  // Deeper plates are BRIGHTER than near plates — perspective + DOF
  // naturally darkens closer plates via the vignette/fog overlays, so
  // far plates need more punch to stay visible as distant rings.
  const canopyColor = depth > 0.5 ? "#1a2e20" : "#0a1810";
  const trunkColor = depth > 0.5 ? "#12201a" : "#08120d";
  const groundColor = depth > 0.5 ? "#0c1a12" : "#060e0a";

  const drawTree = (t: Tree, idx: number, keyPrefix: string) => (
    <g key={`${keyPrefix}-${idx}`}>
      <rect
        x={t.x - t.w / 2}
        y={t.baseY - t.h}
        width={t.w}
        height={t.h}
        fill={trunkColor}
      />
      <ellipse
        cx={t.x}
        cy={t.baseY - t.h + 30}
        rx={t.canopyR}
        ry={t.canopyR * 0.55}
        fill={canopyColor}
      />
      <ellipse
        cx={t.x - t.canopyR * 0.3}
        cy={t.baseY - t.h + t.canopyR * 0.3}
        rx={t.canopyR * 0.7}
        ry={t.canopyR * 0.4}
        fill={canopyColor}
      />
      <ellipse
        cx={t.x + t.canopyR * 0.3}
        cy={t.baseY - t.h + t.canopyR * 0.35}
        rx={t.canopyR * 0.7}
        ry={t.canopyR * 0.4}
        fill={canopyColor}
      />
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <mask id={maskId}>
          <rect x={0} y={0} width={width} height={height} fill="white" />
          <ellipse
            cx={cx}
            cy={cy}
            rx={holeW / 2}
            ry={holeH / 2}
            fill="black"
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx={holeW / 2 + 36}
            ry={holeH / 2 + 36}
            fill="black"
            opacity={0.4}
          />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`}>
        {/* Canopy ceiling — back layer */}
        <polygon points={canopyPts.join(" ")} fill={canopyColor} />

        {/* Background tree fills — drawn before foreground clusters */}
        {trees.map((t, i) => drawTree(t, i, "bg"))}

        {/* Ground silhouette */}
        <polygon points={groundPts.join(" ")} fill={groundColor} />

        {/* Foreground edge clusters — drawn last, biggest, dominate sides */}
        {clusters.map((t, i) => drawTree(t, i, "fg"))}
      </g>
    </svg>
  );
};

// ─── Assemble the kit and produce the scene ─────────────────────

const kit: SceneKit = {
  palette,
  buildPlateCutout: buildForestCutout,
};

export const SceneFPVForest = createFPVScene(kit);
