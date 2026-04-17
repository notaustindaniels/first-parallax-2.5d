/** SceneFPVForestToCity — Masked-frame portal transition.
 *
 *  MODEL (corrected per reference):
 *  A foreground "portal-frame" (foliage wall with a single organic hole)
 *  rushes toward the camera. Its border quickly exceeds the viewport;
 *  the hole grows to fill the frame; we emerge into the city. Heavy
 *  motion blur on the foliage sells the punch-through moment. No whip
 *  pan, no cut — pure forward Z-momentum.
 *
 *  LAYERS (back → front):
 *   CITY        always full-size, 0 opacity → full through the punch
 *   FOREST      full at start, fades out during the punch
 *   KEYHOLE     small organic peek of the city before punch begins
 *   PORTAL      engulfing foliage wall with hole, rushes at camera
 *   RIM FLASH   subtle bloom at punch moment
 *
 *  TIMING (fractions of transition duration):
 *   0%–55%  forest flythrough, small keyhole peek of city visible
 *   55%–78% portal appears large and rushes at camera; forest + keyhole
 *           fade out; city fades in underneath
 *   78%–86% portal engulfs the frame, enters near-cull zone
 *   86%–92% portal dissolves, city fully revealed
 *   92%–100% pure city
 *
 *  FIXES from v1:
 *   - Removed `transform: scale()` on the city AbsoluteFill (was
 *     rendering the city as a shrunken centered rectangle).
 *   - Removed the persistent blur on the city layer.
 *   - Portal plate STARTS LARGE (Z=-2000 → ~0.375x scale), so the
 *     300vw plate already fills the frame from the first punch frame.
 *   - Forest/city child scenes get a 2× inner duration so their own
 *     camera ramps haven't raced past all plates by reveal time.
 *   - Motion blur added via CSS `filter: blur()` keyed to portal
 *     velocity (peaks during engulf).
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

const PERSPECTIVE_PX = 1200;
const NEAR_CULL_START = 480;
const NEAR_CULL_END = 900;

const PORTAL_Z_START = -2000;
const PORTAL_Z_END = 1100;

const PUNCH_BEGIN = 0.55;
const PUNCH_ENGULF = 0.78;
const PUNCH_PIERCE = 0.86;
const PUNCH_DONE = 0.92;

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

  // ── Portal Z trajectory ─────────────────────────────────────────
  let portalZ: number;
  if (p < PUNCH_BEGIN) {
    portalZ = interpolate(p, [0, PUNCH_BEGIN], [-9000, -4000]);
  } else if (p < PUNCH_PIERCE) {
    const rushT = (p - PUNCH_BEGIN) / (PUNCH_PIERCE - PUNCH_BEGIN);
    const eased = Easing.bezier(0.4, 0, 0.85, 1)(rushT);
    portalZ = interpolate(eased, [0, 1], [PORTAL_Z_START, NEAR_CULL_START - 20]);
  } else {
    portalZ = interpolate(
      p,
      [PUNCH_PIERCE, 1],
      [NEAR_CULL_START - 20, PORTAL_Z_END],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
  }

  const portalCullOp = computeNearCullOpacity(portalZ);
  const portalTailFade = interpolate(p, [PUNCH_PIERCE, PUNCH_DONE], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const portalFadeIn = interpolate(
    p,
    [PUNCH_BEGIN - 0.05, PUNCH_BEGIN + 0.02],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const portalOpacity =
    p < PUNCH_BEGIN - 0.05
      ? 0
      : portalCullOp * portalTailFade * portalFadeIn;

  const portalBlurPx = interpolate(
    p,
    [PUNCH_BEGIN, PUNCH_ENGULF - 0.03, PUNCH_ENGULF, PUNCH_PIERCE],
    [0, 2, 14, 22],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── Layer opacities ─────────────────────────────────────────────
  const forestOpacity = interpolate(
    p,
    [0, PUNCH_BEGIN, PUNCH_ENGULF, PUNCH_PIERCE],
    [1, 1, 0.5, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.55, 0, 0.45, 1),
    },
  );

  const cityOpacity = interpolate(
    p,
    [0, PUNCH_BEGIN - 0.05, PUNCH_ENGULF, PUNCH_PIERCE, 1],
    [0, 0, 0.75, 1, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── Early keyhole peek (tiny "portal in the distance" pre-rush) ──
  const keyholeRadius = interpolate(p, [0, PUNCH_BEGIN], [0.04, 0.09], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const keyholeOpacity = interpolate(
    p,
    [0, 0.05, PUNCH_BEGIN, PUNCH_BEGIN + 0.03],
    [0, 0.7, 0.7, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const rimFlashOpacity = interpolate(
    p,
    [PUNCH_ENGULF - 0.02, PUNCH_PIERCE, PUNCH_DONE],
    [0, 0.55, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── Child scene inner durations ────────────────────────────────
  // 2× so neither scene's internal camera ramp exhausts all plates
  // before our wrapper is done.
  const forestInnerDuration = durationInFrames * 2;
  const cityInnerDuration = durationInFrames * 2;

  const cityNode = useMemo(
    () => <SceneFPVCityNight durationInFrames={cityInnerDuration} />,
    [cityInnerDuration],
  );
  const forestNode = useMemo(
    () => <SceneFPVForest durationInFrames={forestInnerDuration} />,
    [forestInnerDuration],
  );
  const portalSvg = useMemo(() => buildPortalPlate(42, 1920, 1080), []);

  return (
    <AbsoluteFill style={{ backgroundColor: "#020306", overflow: "hidden" }}>
      {/* ─── LAYER 1: City (always full-size underneath) ─────────── */}
      <AbsoluteFill
        style={{ opacity: cityOpacity, willChange: "opacity" }}
      >
        {cityNode}
      </AbsoluteFill>

      {/* ─── LAYER 2: Forest ─────────────────────────────────────── */}
      <AbsoluteFill
        style={{ opacity: forestOpacity, willChange: "opacity" }}
      >
        {forestNode}
      </AbsoluteFill>

      {/* ─── LAYER 2.5: Early keyhole peek ──────────────────────── */}
      {keyholeOpacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "46%",
            width: `${keyholeRadius * 200}vmin`,
            height: `${keyholeRadius * 200}vmin`,
            transform: "translate(-50%, -50%)",
            borderRadius: "45% 55% 50% 50% / 55% 45% 55% 45%",
            background:
              "linear-gradient(180deg, #2a1250 0%, #4a1640 50%, #1a0a28 100%)",
            opacity: keyholeOpacity,
            boxShadow: "inset 0 0 40px 10px rgba(4,9,14,0.95)",
            filter: "blur(2px)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* ─── LAYER 3: Portal plate (CSS 3D, rushes at camera) ───── */}
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
                willChange: "transform, opacity, filter",
                opacity: portalOpacity,
                filter:
                  portalBlurPx > 0.5
                    ? `blur(${portalBlurPx.toFixed(1)}px)`
                    : undefined,
              }}
            >
              {portalSvg}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ─── Rim flash ──────────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 48%, rgba(255,240,220,0.5) 0%, rgba(255,240,220,0) 50%)",
          opacity: rimFlashOpacity,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* ─── Vignette ───────────────────────────────────────────── */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 65%, rgba(0,0,0,0.18) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
