/** SceneFPVForestToCity — Parallel-universe portal transition.
 *
 *  ARCHITECTURE (per user's spec):
 *    Two independent scenes render simultaneously from frame 0, both
 *    in the same composition, both at natural scale, each with its
 *    own camera advancing through its own 3D space. There is NO
 *    transition moment, no crossfade, no handoff.
 *
 *    The city scene sits on the bottom layer, always visible in
 *    principle. The forest scene sits on top, OCCLUDING the city
 *    everywhere except through a mask-hole that traces the portal
 *    tree's branch loop. The mask's position and size are computed
 *    per frame from the tree's current Z-depth and the forest's
 *    camera drift — so the hole is pixel-locked to the tree
 *    silhouette on screen.
 *
 *    As the forest's camera approaches the tree, the tree grows via
 *    perspective; the hole grows with it; the forest becomes less
 *    visible; the city underneath becomes more visible. When the
 *    hole exceeds the viewport, the forest is fully hidden and you
 *    see only the city — at its natural scale, with its camera in
 *    its natural flight. No re-mount, no jump, no scale change.
 *
 *  DURATION:
 *    City's internal duration = comp duration × 2, so the city's
 *    camera has plenty of flight left when the reveal completes.
 *
 *  VARIANTS:
 *    This file exports TWO compositions for A/B comparison:
 *      - SceneFPVForestToCity       (pure mechanic)
 *      - SceneFPVForestToCityPunch  (pure + "felt punch-through":
 *                                    brief blur bump + rim flash at
 *                                    the moment the mask hole crosses
 *                                    the viewport edge)
 */
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { computeCameraZ, FPV_CONSTANTS } from "./fpvRecipe";
import { SceneFPVForest, PORTAL_TREE_INITIAL_Z } from "./SceneFPVForest";
import { SceneFPVCityNight } from "./SceneFPVCityNight";
import {
  PORTAL_TREE_HOLE_PATH,
  PORTAL_TREE_VIEWBOX_W,
  PORTAL_TREE_VIEWBOX_H,
} from "./portalTree";

const PERSPECTIVE_PX = FPV_CONSTANTS.PERSPECTIVE_PX;

// The portal tree lives in a 300vw × 300vh wrapper at offset
// (-100vw, -100vh). Its SVG fills that wrapper and uses a
// 1920×1080 viewBox with preserveAspectRatio="xMidYMid slice".
// So a point at SVG (sx, sy) maps to viewport pixel coordinates
// (before perspective, assuming 1920×1080 viewport):
//     container_x = (sx / 1920) * (3 * 1920) - 1920 = 3 * sx - 1920
//     container_y = (sy / 1080) * (3 * 1080) - 1080 = 3 * sy - 1080
// The hole center is at SVG (990, 560):
//     container = (3*990 - 1920, 3*560 - 1080) = (1050, 600)
// CSS perspective scales around perspective-origin (960, 540) by
// factor s = 1200 / (1200 - Z):
//     screen_x = 960 + (1050 - 960) * s = 960 + 90s
//     screen_y = 540 + (600 - 540) * s = 540 + 60s
// The hole's on-screen SIZE: in container pixels the hole SVG path
// is ~3× the SVG-unit path size, after perspective that's 3s×.

const HOLE_SVG_CENTER_X = 990;
const HOLE_SVG_CENTER_Y = 560;

/** Build a CSS mask-image data URL that, when applied to the forest,
 *  hides the portion of the forest where the portal tree's hole
 *  currently projects on screen. */
const buildForestMaskDataUrl = ({
  treeZ,
  camDriftX,
  camDriftY,
  camBankDeg,
  viewportW,
  viewportH,
}: {
  treeZ: number;
  camDriftX: number;
  camDriftY: number;
  camBankDeg: number;
  viewportW: number;
  viewportH: number;
}): string => {
  // When the tree passes the near-cull end (treeZ > 900), the hole
  // has already grown beyond the viewport — the forest is effectively
  // fully hidden. We also hit a math singularity at treeZ = 1200
  // (where s = ∞). So for any treeZ past the cull, return a fully
  // transparent (all-black) mask, making the forest 100% hidden and
  // the city 100% visible.
  if (treeZ >= 900) {
    const emptyMaskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewportW} ${viewportH}" width="${viewportW}" height="${viewportH}"><rect width="${viewportW}" height="${viewportH}" fill="black"/></svg>`;
    const encoded = encodeURIComponent(emptyMaskSvg)
      .replace(/'/g, "%27")
      .replace(/"/g, "%22");
    return `url("data:image/svg+xml;utf8,${encoded}")`;
  }

  // Perspective scale factor for the tree's current Z
  const s = PERSPECTIVE_PX / (PERSPECTIVE_PX - treeZ);

  // Container is 3× viewport (300vw × 300vh). Points in the 1920×1080
  // SVG viewBox sit in that container at 3× scale; then shifted by
  // (-viewportW, -viewportH) because container is offset (-100vw,-100vh).
  // After perspective scale s around center:
  //   screen_x = cx + (container_x - cx) * s
  // where cx = viewportW / 2, container_x = 3*sx - viewportW.
  // So:
  //   screen_x = cx + ((3*sx - viewportW) - cx) * s
  //            = cx + (3*sx - 1.5*viewportW) * s
  //            = cx + 3*s*(sx - viewportW/2)
  // which is: around viewport center cx, offset by 3*s*(sx - 960).
  //
  // For the hole center at SVG (990, 560) on a 1920×1080 viewport
  // (cx = 960, cy = 540):
  //   dx = 3 * s * (990 - 960) = 90 * s
  //   dy = 3 * s * (560 - 540) = 60 * s
  // screen_center = (960 + 90s + camDriftX, 540 + 60s + camDriftY)
  // (bank rotation is about viewport center; we'll include that below)

  const holeScreenCx = viewportW / 2 + 90 * s + camDriftX;
  const holeScreenCy = viewportH / 2 + 60 * s + camDriftY;

  // The hole path in SVG coords needs to be scaled by 3*s (since
  // container is 3× viewport and perspective adds factor s) and
  // translated so its center lands at (holeScreenCx, holeScreenCy).
  // The SVG path is expressed in the original 1920×1080 viewBox,
  // with center at (HOLE_SVG_CENTER_X, HOLE_SVG_CENTER_Y).
  // Transform: translate to put SVG center at screen center, scale
  // around that center.
  const scale = 3 * s;
  const tx = holeScreenCx - HOLE_SVG_CENTER_X * scale;
  const ty = holeScreenCy - HOLE_SVG_CENTER_Y * scale;

  // Mask SVG: white rect covering MORE than the full viewport (so that
  // rotation from camera bank doesn't expose transparent corners),
  // with the hole path drawn in black on top.
  // The white rect is oversized by `padding` on each side to cover
  // even large rotations.
  const padding = 300;
  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewportW} ${viewportH}" width="${viewportW}" height="${viewportH}"><g transform="rotate(${camBankDeg.toFixed(2)} ${viewportW / 2} ${viewportH / 2})"><rect x="${-padding}" y="${-padding}" width="${viewportW + padding * 2}" height="${viewportH + padding * 2}" fill="white"/><path transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})" d="${PORTAL_TREE_HOLE_PATH}" fill="black"/></g></svg>`;

  const encoded = encodeURIComponent(maskSvg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `url("data:image/svg+xml;utf8,${encoded}")`;
};

type TransitionProps = {
  durationInFrames: number;
  /** If true, add "felt punch-through" effects (brief blur bump and
   *  rim flash) at the moment the mask hole reaches the viewport
   *  edges. */
  withPunchEffect?: boolean;
  [key: string]: unknown;
};

const SceneFPVForestToCityCore: React.FC<TransitionProps> = ({
  durationInFrames,
  withPunchEffect = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Mirror the forest's internal camera math exactly so the mask
  // stays pixel-locked to the tree silhouette.
  const cameraZ = computeCameraZ(frame, durationInFrames);
  const treeZ = PORTAL_TREE_INITIAL_Z + cameraZ;
  const camDriftX = Math.sin((frame / fps) * 1.2) * 35;
  const camDriftY = Math.cos((frame / fps) * 1.5) * 22;
  const buffet = Math.sin((frame / fps) * 7.1) * 5;
  const camBankDeg = -camDriftX * 0.25;

  const maskUrl = useMemo(
    () =>
      buildForestMaskDataUrl({
        treeZ,
        camDriftX,
        camDriftY: camDriftY + buffet,
        camBankDeg,
        viewportW: width,
        viewportH: height,
      }),
    [treeZ, camDriftX, camDriftY, buffet, camBankDeg, width, height],
  );

  // Felt punch-through effect: when the hole is about to exceed the
  // viewport (tree's on-screen width > viewport width), briefly bump
  // a blur and flash a rim. Hole width on screen at scale s = 3s * 180
  // (hole is ~180 SVG units wide). Crosses viewport width (1920) when
  // 540s > 1920, i.e., s > 3.56, i.e., Z > 863.
  // Near-cull starts at Z=480 (s=2.0) and ends at Z=900 (s=4.0). So
  // we use the near-cull window as the punch window.
  let punchBlurPx = 0;
  let punchFlashOpacity = 0;
  if (withPunchEffect) {
    // Peak punch at treeZ ≈ 700 (midway through cull zone, s ≈ 2.4)
    const punchP = interpolate(treeZ, [480, 700, 900], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    punchBlurPx = punchP * 10;
    punchFlashOpacity = punchP * 0.35;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#020306", overflow: "hidden" }}>
      {/* Bottom layer: city, always rendering, natural scale, its own
          camera. Duration is 2× comp so it has plenty of flight left
          when the reveal completes. */}
      <AbsoluteFill>
        <SceneFPVCityNight durationInFrames={durationInFrames * 2} />
      </AbsoluteFill>

      {/* Top layer: forest, always rendering, masked so its content
          is hidden through the portal tree's hole. The tree
          silhouette IS part of the forest (from its extraLayer), so
          the visible outline around the hole is the actual tree. */}
      <AbsoluteFill
        style={{
          WebkitMaskImage: maskUrl,
          maskImage: maskUrl,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "0 0",
          maskPosition: "0 0",
          maskMode: "luminance" as const,
          filter:
            withPunchEffect && punchBlurPx > 0.05
              ? `blur(${punchBlurPx.toFixed(2)}px)`
              : undefined,
          willChange: "mask-image, filter",
        }}
      >
        <SceneFPVForest durationInFrames={durationInFrames} />
      </AbsoluteFill>

      {/* Optional: rim flash at punch moment — a subtle radial bloom
          centered on the hole, visible only in the punch variant. */}
      {withPunchEffect && punchFlashOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            opacity: punchFlashOpacity,
            background: `radial-gradient(ellipse at ${((width / 2 + 90 * (PERSPECTIVE_PX / (PERSPECTIVE_PX - treeZ))) / width) * 100}% ${((height / 2 + 60 * (PERSPECTIVE_PX / (PERSPECTIVE_PX - treeZ))) / height) * 100}%, rgba(255,240,210,0.45) 0%, rgba(255,240,210,0.0) 45%)`,
            mixBlendMode: "screen",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/** Pure mechanic — no extra effects. */
export const SceneFPVForestToCity: React.FC<TransitionProps> = (props) => (
  <SceneFPVForestToCityCore {...props} withPunchEffect={false} />
);

/** With felt punch-through — brief blur bump + rim flash at the
 *  moment the mask hole crosses the viewport edge. */
export const SceneFPVForestToCityPunch: React.FC<TransitionProps> = (props) => (
  <SceneFPVForestToCityCore {...props} withPunchEffect={true} />
);
