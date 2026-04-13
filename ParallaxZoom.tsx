import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/*
 * ── 2.5D Zoom-Scroll Parallax — Misty Mountain Golden Hour ──
 *
 *  Seven layers, CSS perspective container (1200px / 50% 60%).
 *  depth 0 = farthest (sky), depth 1 = closest (foreground).
 *  Scale, translateY, and translateX are each amplified by
 *  (1 + depth * 0.8) so near layers move more than far ones.
 * ────────────────────────────────────────────────────────────
 */

// ─── Layer data ───────────────────────────────────────────────
interface LayerDef {
  id: string;
  depth: number;
  content: React.FC;
}

// ─── Scene components ─────────────────────────────────────────

/** Deep-indigo-to-gold sky gradient + 25 twinkling stars */
const SkyLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #0b1026 0%, #1b3a6b 35%, #e8a87c 72%, #f7d9a8 100%)",
        }}
      />
      {/* Stars occupy top 40% of the sky (cy: 0–40 in a 0–100 viewBox) */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {Array.from({ length: 25 }, (_, i) => {
          const cx = ((i * 137.5) % 100).toFixed(1);
          const cy = ((i * 73.7) % 40).toFixed(1);
          const r = (0.15 + (i % 4) * 0.18).toFixed(2);
          const base = 0.35 + (i % 5) * 0.1;
          const opacity = Math.max(
            0.05,
            Math.min(1, base + Math.sin((frame / fps) * 2 + i * 1.1) * 0.2),
          );
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="white" opacity={opacity} />
          );
        })}
      </svg>
    </>
  );
};

/** Golden-hour sun with pulsing radial halo — x 70%, y 25% */
const Sun: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Halo opacity breathes slowly between 0.5 and 0.7
  const haloOpacity = 0.5 + Math.sin((frame / fps) * 0.7) * 0.1;

  // Sun center: 70% from left (1344px), 25% from top (270px) in 1920×1080
  const SX = 1344;
  const SY = 270;

  return (
    <svg
      viewBox="0 0 1920 1080"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <defs>
        <radialGradient
          id="sunHalo"
          cx={SX}
          cy={SY}
          r={320}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffd700" stopOpacity={haloOpacity} />
          <stop offset="45%" stopColor="#ff9800" stopOpacity={haloOpacity * 0.25} />
          <stop offset="100%" stopColor="#ff6600" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* Outer glow halo */}
      <circle cx={SX} cy={SY} r={320} fill="url(#sunHalo)" />
      {/* Sun disc */}
      <circle cx={SX} cy={SY} r={55} fill="#fff8e7" />
      {/* Bright core */}
      <circle cx={SX} cy={SY} r={32} fill="#fffde0" />
    </svg>
  );
};

/** Far mountain range — muted blue-gray, 40% height from bottom */
const FarMountains: React.FC = () => (
  <svg
    viewBox="0 0 1920 600"
    preserveAspectRatio="none"
    style={{ position: "absolute", bottom: 0, width: "100%", height: "40%" }}
  >
    <polygon
      points="0,600 150,220 380,350 620,130 860,270 1100,80 1380,210 1620,150 1840,280 1920,300 1920,600"
      fill="#1a2744"
    />
  </svg>
);

/** Mid mountain range — darker, taller peaks, overlapping first range */
const MidMountains: React.FC = () => (
  <svg
    viewBox="0 0 1920 600"
    preserveAspectRatio="none"
    style={{ position: "absolute", bottom: 0, width: "100%", height: "43%" }}
  >
    <polygon
      points="0,600 100,260 320,340 560,200 780,310 1020,130 1260,250 1500,180 1740,290 1920,240 1920,600"
      fill="#243352"
    />
  </svg>
);

/** Procedural pine treeline — 26 triangle trees of varying size */
const Treeline: React.FC = () => (
  <svg
    viewBox="0 0 1920 500"
    preserveAspectRatio="none"
    style={{ position: "absolute", bottom: 0, width: "100%", height: "40%" }}
  >
    {Array.from({ length: 26 }, (_, i) => {
      const x = (i / 26) * 1920 + ((i * 47) % 80) - 40;
      const h = 80 + (i % 7) * 22;   // 80–214 px height
      const w = 20 + (i % 4) * 8;    // 20–44 px width
      const fill = i % 2 === 0 ? "#0f1e28" : "#152530";
      return (
        <g key={i} transform={`translate(${x}, ${500 - h})`}>
          <polygon points={`${w / 2},0 ${w},${h} 0,${h}`} fill={fill} />
        </g>
      );
    })}
  </svg>
);

/** Atmospheric mist — two semi-transparent horizontal ellipses */
const Mist: React.FC = () => (
  <svg
    viewBox="0 0 1920 1080"
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
  >
    <ellipse cx={960}  cy={780} rx={900} ry={80} fill="white" opacity={0.08} />
    <ellipse cx={576}  cy={840} rx={700} ry={60} fill="white" opacity={0.06} />
  </svg>
);

/** Foreground — dark ground mass + 16 grass tuft groups */
const Foreground: React.FC = () => (
  <svg
    viewBox="0 0 1920 300"
    preserveAspectRatio="none"
    style={{ position: "absolute", bottom: 0, width: "100%", height: "20%" }}
  >
    <ellipse cx={200}  cy={280} rx={280} ry={65} fill="#0a1210" />
    <ellipse cx={1720} cy={275} rx={320} ry={75} fill="#0a1210" />
    {Array.from({ length: 16 }, (_, i) => {
      const x = 60 + i * 112;
      return (
        <g key={i}>
          <line x1={x}     y1={300} x2={x - 7}  y2={255} stroke="#1a3020" strokeWidth={2} />
          <line x1={x + 5} y1={300} x2={x + 11} y2={250} stroke="#1a3020" strokeWidth={2} />
          <line x1={x + 9} y1={300} x2={x + 3}  y2={260} stroke="#152a1c" strokeWidth={2} />
        </g>
      );
    })}
  </svg>
);

// ─── Layer stack (back → front) ───────────────────────────────
// Note: mist (depth 0.5) is intentionally rendered after treeline (depth 0.65)
// so it visually floats in front of the trees while moving more slowly.
const LAYER_DEFS: LayerDef[] = [
  { id: "sky",        depth: 0,    content: SkyLayer },
  { id: "sun",        depth: 0.05, content: Sun },
  { id: "far-mtns",   depth: 0.2,  content: FarMountains },
  { id: "mid-mtns",   depth: 0.4,  content: MidMountains },
  { id: "treeline",   depth: 0.65, content: Treeline },
  { id: "mist",       depth: 0.5,  content: Mist },
  { id: "foreground", depth: 1.0,  content: Foreground },
];

// ─── Main composition ─────────────────────────────────────────
export const ParallaxZoom: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // ── Master progress 0 → 1 over 900 frames, editorial ease-in-out
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Base motion values derived linearly from progress
  const baseZoom   = interpolate(progress, [0, 1], [1.0, 1.65]);
  const baseDriftY = interpolate(progress, [0, 1], [0, -140]);
  const baseDriftX = interpolate(progress, [0, 1], [0, -50]);

  // ── Mist independent oscillation: amplitude 30px, period ≈ 10s
  const mistOscillation = Math.sin((frame / fps) * 0.63) * 30;

  // ── Scene fade in (0–45) and fade out (855–900)
  let sceneOpacity = 1;
  if (frame <= 45) {
    sceneOpacity = interpolate(frame, [0, 45], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else if (frame >= 855) {
    sceneOpacity = interpolate(frame, [855, 900], [1, 0], {
      easing: Easing.bezier(0.45, 0, 0.55, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  // ── Film grain: feTurbulence seed cycles every 2 frames
  const seed = Math.floor(frame / 2) % 12;
  const grainSvg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>` +
    `<filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' seed='${seed}'/>` +
    `<feColorMatrix type='saturate' values='0'/></filter>` +
    `<rect width='256' height='256' filter='url(#g)'/></svg>`;
  const grainUrl = `url("data:image/svg+xml,${encodeURIComponent(grainSvg)}")`;

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#0b1026", overflow: "hidden", opacity: sceneOpacity }}
    >
      {/* ── CSS 3D perspective container ─────────────────── */}
      <div
        style={{
          width: "100%",
          height: "100%",
          perspective: 1200,
          perspectiveOrigin: "50% 60%",
        }}
      >
        {LAYER_DEFS.map(({ id, depth, content: Content }) => {
          /*
           * Per-layer parallax math:
           *   depthMultiplier amplifies all motion for near layers
           *   scale = 1 + (baseZoom - 1) × depthMultiplier
           *   translateY = baseDriftY × depthMultiplier
           *   translateX = baseDriftX × depthMultiplier × 0.5
           */
          const depthMultiplier = 1 + depth * 0.8;
          const layerScale = 1 + (baseZoom - 1) * depthMultiplier;
          const layerY = baseDriftY * depthMultiplier;
          let   layerX = baseDriftX * depthMultiplier * 0.5;

          // Mist additionally drifts with slow sinusoidal oscillation
          if (id === "mist") {
            layerX += mistOscillation;
          }

          // CSS translateZ reinforces the CSS 3D perspective separation
          const translateZ = depth * 60;

          return (
            <AbsoluteFill
              key={id}
              style={{
                transform: `translateZ(${translateZ}px) translate(${layerX}px, ${layerY}px) scale(${layerScale})`,
                transformOrigin: "50% 60%",
                willChange: "transform",
              }}
            >
              <Content />
            </AbsoluteFill>
          );
        })}
      </div>

      {/* ── Post-processing overlays ─────────────────────── */}

      {/* Cinematic vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Film grain at 3% opacity */}
      <AbsoluteFill
        style={{
          backgroundImage: grainUrl,
          backgroundRepeat: "repeat",
          opacity: 0.03,
          pointerEvents: "none",
        }}
      />

      {/* Warm golden color wash */}
      <AbsoluteFill
        style={{
          background: "rgba(255, 180, 100, 0.04)",
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
