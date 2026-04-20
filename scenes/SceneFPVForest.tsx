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
  computeDOFBlur,
  computeDepthFade,
  computeNearCull,
} from "./fpvRecipe";
import { PortalTreeWithReveal } from "./portalTree";

// Portal tree Z trajectory.
// `initialZ` is a fixed Z offset; `renderedZ = initialZ + cameraZ`.
// With cameraZ ranging ~1330→11400 over a 240-frame flight, picking
// initialZ = -9500 makes the tree start at renderedZ ≈ -8170 (far,
// small) and end at renderedZ ≈ 1900 (past the camera). The tree
// crosses Z=0 ("fills the frame at natural scale") around 92% of
// the way through the clip.
export const PORTAL_TREE_INITIAL_Z = -9500;

/** Companion foliage clustered around the portal tree. These travel
 *  with the camera (NO wrap — same trajectory as the portal tree),
 *  so they give parallax cues that embed the portal in a real place
 *  in the forest. Some are slightly in front of the portal (they
 *  pass the camera first), some are at portal depth (they frame
 *  the tree in the scene), some are behind (they fill the middle
 *  distance behind the portal).
 *
 *  IMPORTANT: positions are chosen so none cover the portal's hole
 *  at viewport center, and so all either pass well to the sides of
 *  the camera's flight path or are behind the portal (invisible by
 *  the time the forest mask has gone fully transparent). */
type PortalCompanion = {
  /** Z offset relative to PORTAL_TREE_INITIAL_Z. Positive = closer
   *  to camera (passes first). Negative = further (passes later). */
  zOffset: number;
  /** X offset in viewport pixels from center. */
  x: number;
  /** Y offset in viewport pixels from center. */
  y: number;
  /** SmallTree variant (0-3, affects size). */
  variant: number;
  /** Seed for randomization of branch detail. */
  seed: number;
};

const PORTAL_COMPANIONS: PortalCompanion[] = [
  // Group A — foreground, pass camera before the portal
  { zOffset: 600, x: -900, y: -50, variant: 2, seed: 8121 },
  { zOffset: 700, x: 950, y: 40, variant: 3, seed: 8122 },
  { zOffset: 500, x: -1300, y: 120, variant: 1, seed: 8123 },
  { zOffset: 450, x: 1250, y: -80, variant: 2, seed: 8124 },
  // Group B — at portal depth, framing it to the sides
  { zOffset: 0, x: -700, y: 180, variant: 2, seed: 8125 },
  { zOffset: 0, x: 650, y: 200, variant: 3, seed: 8126 },
  { zOffset: 100, x: -450, y: 260, variant: 1, seed: 8127 },
  { zOffset: -100, x: 500, y: 280, variant: 1, seed: 8128 },
  // Group C — behind the portal, distance fillers (mostly irrelevant
  // after portal passes because the forest mask engulfs by then, but
  // they contribute to the sense of depth during the approach)
  { zOffset: -1200, x: -250, y: 220, variant: 1, seed: 8129 },
  { zOffset: -1400, x: 300, y: 200, variant: 2, seed: 8130 },
  { zOffset: -1800, x: -100, y: 240, variant: 0, seed: 8131 },
];

/** Builder for an extraLayer that renders the portal tree AND its
 *  companion foliage in the forest's preserve-3d container. The tree
 *  and companions all travel with the camera (no wrap), giving the
 *  portal a sense of place in the forest. */
export const buildPortalTreeLayer = () => {
  return ({ cameraZ }: {
    frame: number;
    durationInFrames: number;
    cameraZ: number;
    fps: number;
  }): React.ReactNode => {
    const treeZ = PORTAL_TREE_INITIAL_Z + cameraZ;
    const treeFadeOpacity = computeDepthFade(treeZ);
    const treeCullOpacity = computeNearCull(treeZ);
    const treeOpacity = treeFadeOpacity * treeCullOpacity;
    const treeBlurPx = computeDOFBlur(treeZ);

    return (
      <>
        {/* Companion foliage — scattered at various (x,y,z) offsets
            around the portal, travelling with the camera at the same
            rate (no wrap). Gives parallax cues so the viewer feels
            the portal is embedded in a specific place in the forest
            rather than floating ahead. */}
        {PORTAL_COMPANIONS.map((c, idx) => {
          const companionZ = PORTAL_TREE_INITIAL_Z + c.zOffset + cameraZ;
          const fadeOpacity = computeDepthFade(companionZ);
          const cullOpacity = computeNearCull(companionZ);
          const opacity = fadeOpacity * cullOpacity;
          const blurPx = computeDOFBlur(companionZ);
          if (opacity < 0.01) return null;
          return (
            <div
              key={`portal-companion-${idx}`}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate3d(${c.x}px, ${c.y}px, ${companionZ.toFixed(1)}px)`,
                transformStyle: "preserve-3d",
                willChange: "transform",
              }}
            >
              <div
                style={{
                  opacity,
                  filter:
                    blurPx > 0.1 ? `blur(${blurPx.toFixed(1)}px)` : undefined,
                }}
              >
                <SmallTree variant={c.variant} seed={c.seed} />
              </div>
            </div>
          );
        })}

        {/* The portal tree itself — hand-authored silhouette at a
            fixed Z that travels toward the camera over the scene. */}
        {treeOpacity >= 0.005 && (
          <div
            style={{
              position: "absolute",
              left: "-100vw",
              top: "-100vh",
              width: "300vw",
              height: "300vh",
              transform: `translate3d(0px, 0px, ${treeZ.toFixed(1)}px)`,
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                opacity: treeOpacity,
                filter:
                  treeBlurPx > 0.1
                    ? `blur(${treeBlurPx.toFixed(1)}px)`
                    : undefined,
                willChange: "opacity, filter",
              }}
            >
              <PortalTreeWithReveal />
            </div>
          </div>
        )}
      </>
    );
  };
};

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
  extraLayer: buildPortalTreeLayer(),
};

export const SceneFPVForest = createFPVScene(kit);
export const forestKit = kit;
