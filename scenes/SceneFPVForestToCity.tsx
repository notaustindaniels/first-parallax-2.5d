/** SceneFPVForestToCity — Portal zoom-through transition.
 *
 *  Phase 11: total rewrite per user feedback.
 *  - NO whip pan, NO horizontal slam, NO flash blackout.
 *  - Pure forward Z-momentum through an organic hole in a foliage wall.
 *
 *  THREE-LAYER ARCHITECTURE (back → front):
 *
 *  1. CITY LAYER  — always rendering underneath. Its drone-flight is
 *                    already in progress, so when we reveal it, it has
 *                    motion and depth. We hold it at slightly reduced
 *                    opacity + mild blur until the punch moment to sell
 *                    the "it's far away, seen through a hole" feeling.
 *
 *  2. FOREST LAYER — the forest flythrough. Fades out ONLY in the final
 *                    portion (frame > 80%) so the portal-plate approach
 *                    is naturally framed by real forest around it.
 *
 *  3. PORTAL PLATE — a DEDICATED CSS-3D element sitting in its own
 *                    perspective context, overlaid on top of both
 *                    layers. It's a dense foliage wall with a single
 *                    organic hole dead-center. Its translateZ advances
 *                    deterministically from -10000 (far, tiny, centered
 *                    showing a portal-shaped peek of the forest/city)
 *                    all the way past the camera (Z=900+). As the
 *                    portal's translateZ crosses the near-cull zone,
 *                    it fades out — the same way every other plate
 *                    does — and we're through.
 *
 *  The visual effect: the viewer sees the forest around them, with a
 *  distant peek of "something else" through a hole in a leafy wall up
 *  ahead. The hole grows and grows (because the wall is approaching)
 *  until it consumes the entire frame — and as the leaves of the wall
 *  blow past the lens, the city is already there.
 */
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { SceneFPVCityNight } from "./SceneFPVCityNight";
import { SceneFPVForest, buildPortalPlate } from "./SceneFPVForest";

export type SceneFPVForestToCityProps = {
  durationInFrames: number;
  [key: string]: unknown;
};

// Must match fpvRecipe.PERSPECTIVE_PX so the portal plate's scaling
// behaviour is identical to the rest of the scene geometry.
const PERSPECTIVE_PX = 1200;
const NEAR_CULL_START = 480;
const NEAR_CULL_END = 900;

// Where the portal plate starts (far) and ends (past the camera).
const PORTAL_Z_START = -10000;
const PORTAL_Z_END = 1100; // safely past the near-cull

// Timing — fractions of the transition duration
const PORTAL_APPROACH_START = 0.0;
const PORTAL_AT_CAMERA = 0.72;   // portal's translateZ = 0 around here
const PORTAL_PUNCH_THROUGH = 0.82; // portal starts leaving the cull zone
const PORTAL_GONE = 0.90;         // portal fully faded

const computeNearCullOpacity = (z: number): number =>
  interpolate(z, [NEAR_CULL_START, NEAR_CULL_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const SceneFPVForestToCity: React.FC<SceneFPVForestToCityProps> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const p = frame / durationInFrames;

  // ── Portal plate Z trajectory ─────────────────────────────────
  // Non-linear: approaches slowly, then accelerates as it gets close
  // (matching how a real drone sees oncoming obstacles — distant
  // things hardly seem to move, near things rush past).
  const portalZEase = Math.pow(
    interpolate(p, [PORTAL_APPROACH_START, PORTAL_PUNCH_THROUGH], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.8, 1), // ease-in: slow then accelerating
    }),
    1,
  );

  // After PORTAL_PUNCH_THROUGH, the portal is past the cull zone,
  // so its exact Z doesn't matter visually — we just march it on.
  const portalZ =
    p <= PORTAL_PUNCH_THROUGH
      ? interpolate(portalZEase, [0, 1], [PORTAL_Z_START, NEAR_CULL_START - 50])
      : interpolate(
          p,
          [PORTAL_PUNCH_THROUGH, 1],
          [NEAR_CULL_START - 50, PORTAL_Z_END],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

  // Near-cull opacity for the portal plate itself
  const portalCullOpacity = computeNearCullOpacity(portalZ);

  // Additional safety fade for when the portal has fully passed
  const portalTailFade = interpolate(
    p,
    [PORTAL_PUNCH_THROUGH, PORTAL_GONE],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const portalOpacity = portalCullOpacity * portalTailFade;

  // ── Forest backdrop opacity ───────────────────────────────────
  // Stay at 1.0 for most of the flight, then fade to 0 as the portal
  // crosses the camera. The forest's own last-plate fade gives us
  // some cover, but we also ramp down the whole layer.
  const forestOpacity = interpolate(
    p,
    [0, 0.65, 0.85, 0.95],
    [1, 1, 0.4, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.55, 0, 0.45, 1),
    },
  );

  // ── City layer — held "far away" until punch, then snaps to full ─
  // The city is always rendering beneath; its opacity and focus
  // ramp as the portal reveals more of it.
  const cityOpacity = interpolate(
    p,
    [0, 0.4, PORTAL_AT_CAMERA, PORTAL_GONE, 1],
    [0.25, 0.35, 0.55, 1, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Blur on city layer: reads as "defocused background" until the
  // portal lets us see it clearly.
  const cityBlur = interpolate(
    p,
    [0, 0.4, PORTAL_AT_CAMERA, PORTAL_GONE],
    [6, 5, 3, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── Rim-flash at punch-through ────────────────────────────────
  // A soft radial brightening right as we pierce the leafy wall,
  // mimicking the "lens bloom" when going from a dark enclosed
  // space into an open lit one.
  const rimFlashOpacity = interpolate(
    p,
    [PORTAL_AT_CAMERA - 0.02, PORTAL_PUNCH_THROUGH, PORTAL_GONE],
    [0, 0.7, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Memoize heavy child scenes
  const cityNode = useMemo(
    () => <SceneFPVCityNight durationInFrames={durationInFrames} />,
    [durationInFrames],
  );
  const forestNode = useMemo(
    () => <SceneFPVForest durationInFrames={durationInFrames} />,
    [durationInFrames],
  );
  const portalSvg = useMemo(() => buildPortalPlate(42, 1920, 1080), []);

  return (
    <AbsoluteFill style={{ backgroundColor: "#020306", overflow: "hidden" }}>
      {/* ─── LAYER 1: City (background) ─────────────────────────── */}
      <AbsoluteFill
        style={{
          opacity: cityOpacity,
          filter: cityBlur > 0.1 ? `blur(${cityBlur.toFixed(1)}px)` : undefined,
          willChange: "opacity, filter",
        }}
      >
        {cityNode}
      </AbsoluteFill>

      {/* ─── LAYER 2: Forest (midground) ────────────────────────── */}
      <AbsoluteFill
        style={{
          opacity: forestOpacity,
          willChange: "opacity",
        }}
      >
        {forestNode}
      </AbsoluteFill>

      {/* ─── LAYER 3: Portal plate (foreground, in its own 3D space) ── */}
      {portalOpacity > 0.005 && (
        <AbsoluteFill
          style={{
            perspective: `${PERSPECTIVE_PX}px`,
            perspectiveOrigin: "50% 50%",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "-100vw",
                top: "-100vh",
                width: "300vw",
                height: "300vh",
                transform: `translate3d(0px, 0px, ${portalZ.toFixed(1)}px)`,
                transformStyle: "preserve-3d",
                willChange: "transform, opacity",
                opacity: portalOpacity,
              }}
            >
              {portalSvg}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ─── Rim-flash overlay ──────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 48%, rgba(255,240,220,0.40) 0%, rgba(255,240,220,0) 50%)",
          opacity: rimFlashOpacity,
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />

      {/* ─── Global vignette ────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
