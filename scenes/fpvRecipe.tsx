/** fpvRecipe.tsx — Cutout-plate FPV drone scene recipe.
 *
 *  ARCHITECTURE (radically different from earlier revisions):
 *  ============================================================
 *  A scene is a stack of 5–7 flat "painted cutout" plates at varying Z.
 *  Each plate is ONE full-viewport SVG cutout — a dense silhouette with a
 *  transparent hole near the center that the camera flies through.
 *
 *  There are no individual assets, no collision tubes, no placement loops.
 *  The scene author's job is to paint six cutouts (one per plate depth),
 *  and that's it.
 *
 *  This is a Disney multiplane camera in CSS 3D. Plates at different Z
 *  values create depth through occlusion and perspective projection.
 *
 *  Scene author's contract:
 *   - provide `kit.buildPlateCutout({plateIndex, plateCount, seed, width, height})`
 *     that returns a React node (typically an <svg>) drawing the silhouette
 *     for a given depth. Near-plates should have thicker borders / smaller
 *     holes; far plates can be sparser.
 *
 *  Implements the rules from fpv-drone-parallax.md:
 *   - Part 1   CSS 3D perspective
 *   - Part 4   Plate treadmill with wrap-around
 *   - Part 5   Mid-flight start + exponential ramp
 *   - Part 6   Depth fade from the fog
 *   - Part 8   Drone wobble & bank
 *   - Part 13  Cinematic depth of field (non-monotonic Z-blur)
 *   - Part 14  Y-axis reveal pan
 *   Replaces Parts 2 (placement), 9 (collision tube), 11 (cutout density
 *   via asset count), 12 (scale discrepancy via CSS scale) with the
 *   cutout-plate architecture described above.
 */
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ── Public types ────────────────────────────────────────────────

export type PlateCutoutProps = {
  /** 0 = foreground (thickest borders, smallest hole), plateCount-1 = deepest. */
  plateIndex: number;
  /** Total number of plates in the tunnel. */
  plateCount: number;
  /** Deterministic seed unique to this plate. */
  seed: number;
  /** Viewport dimensions in pixels (nominal 1920×1080). */
  width: number;
  height: number;
};

export type PlateCutoutFn = (props: PlateCutoutProps) => React.ReactNode;

export type ScenePalette = {
  backgroundGradient: string;
  fogColor: string;
  showStarfield: boolean;
};

/** Interstitial sub-objects that populate the space between macro plates.
 *  These are the rapid-speed particles (individual trees, streetlights,
 *  cars) that sell scale and motion between the big cutout frames. */
export type SubObjectSpec = {
  Component: React.FC<{ variant: number; seed: number }>;
  count: number;
  xRange: [number, number];
  yRange: [number, number];
};

export type SceneKit = {
  palette: ScenePalette;
  /** Paint the cutout for a plate of given depth. Organic framing —
   *  the center is left empty by the arrangement of the silhouettes,
   *  not by a geometric mask. */
  buildPlateCutout: PlateCutoutFn;
  /** Interstitial sub-objects spawned between macro plates. */
  subObjects?: SubObjectSpec[];
  /** Per-scene camera Y override for custom swoops (e.g., city dive).
   *  Receives the same panProgress (0..1) and returns a Y offset in px.
   *  If omitted, the default linear pan from VERTICAL_PAN_START_Y to
   *  VERTICAL_PAN_END_Y is used. */
  cameraYOverride?: (panProgress: number) => number;
};

export type FPVSceneProps = {
  durationInFrames: number;
  masterSeed?: number;
  [key: string]: unknown;
};

// ── Constants (shared across every scene) ──────────────────────

const PLATE_COUNT = 6;
const PLATE_Z_SPACING = 2000;
const Z_RANGE = PLATE_COUNT * PLATE_Z_SPACING; // 12000
// Z_NEAR must stay strictly < PERSPECTIVE_PX or plates go behind the camera.
const Z_NEAR = 700;
const Z_FAR = Z_NEAR - Z_RANGE; // -11300

// Camera ramp — Part 5
const FRAME_OFFSET = 60;
const BASE_SPEED = 18;
const RAMP_TOTAL = 6000;
const EASE_EXPONENT = 2.2;

// Far fade — Part 6
const FAR_FADE_START = Z_FAR + 500;
const FAR_FADE_END = Z_FAR + 4000;

// Cinematic DOF — Part 13
// Non-monotonic blur: slight atmospheric haze at far, razor sharp in the
// midground focal plane, heavy bokeh for plates past the lens.
const FOCUS_Z = -2500;
const FAR_ATMO_BLUR = 4;
const NEAR_BLUR_MAX = 15;

// Y-axis reveal — Part 14
const VERTICAL_PAN_START_Y = -180;
const VERTICAL_PAN_END_Y = 120;

// SVG drawing coordinate system for plate cutouts. The SVG uses this
// viewBox; the outer div is much larger (300vw × 300vh) so perspective
// can scale plates from tiny-far-rings up to frame-engulfing-walls
// purely via translateZ.
const NOMINAL_WIDTH = 1920;
const NOMINAL_HEIGHT = 1080;

// Perspective — Part 1
const PERSPECTIVE_PX = 1000;

// ── Deterministic PRNG ──────────────────────────────────────────

const mulberry32 = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const sceneRng = mulberry32;

// ── Plate construction ──────────────────────────────────────────

type Plate = {
  id: number;
  initialZ: number;
  seed: number;
};

const makePlates = (masterSeed: number): Plate[] => {
  const rand = mulberry32(masterSeed);
  const plates: Plate[] = [];
  for (let i = 0; i < PLATE_COUNT; i++) {
    const initialZ = -500 - i * PLATE_Z_SPACING; // -500, -2500, -4500, -6500, -8500, -10500
    plates.push({
      id: i,
      initialZ,
      seed: Math.floor(rand() * 1_000_000) + i * 1000,
    });
  }
  return plates;
};

// ── Camera ──────────────────────────────────────────────────────

export const computeCameraZ = (
  frame: number,
  durationInFrames: number,
): number => {
  const effFrame = frame + FRAME_OFFSET;
  const effDuration = durationInFrames + FRAME_OFFSET;
  const progress = Math.min(1, effFrame / effDuration);
  const eased = Math.pow(progress, EASE_EXPONENT);
  return BASE_SPEED * effFrame + eased * RAMP_TOTAL;
};

export const computeCameraVelocity = (
  frame: number,
  durationInFrames: number,
): number => {
  const effFrame = frame + FRAME_OFFSET;
  const effDuration = durationInFrames + FRAME_OFFSET;
  const p = Math.min(1, effFrame / effDuration);
  const rampSlope =
    p < 1
      ? (EASE_EXPONENT * Math.pow(p, EASE_EXPONENT - 1) * RAMP_TOTAL) /
        effDuration
      : 0;
  return BASE_SPEED + rampSlope;
};

export const debugCameraTrace = (durationInFrames: number) => ({
  f0: {
    z: computeCameraZ(0, durationInFrames),
    v: computeCameraVelocity(0, durationInFrames),
  },
  fMid: {
    z: computeCameraZ(Math.floor(durationInFrames / 2), durationInFrames),
    v: computeCameraVelocity(
      Math.floor(durationInFrames / 2),
      durationInFrames,
    ),
  },
  fEnd: {
    z: computeCameraZ(durationInFrames - 1, durationInFrames),
    v: computeCameraVelocity(durationInFrames - 1, durationInFrames),
  },
});

const wrapZ = (initialZ: number, cameraZ: number): number => {
  const raw = initialZ + cameraZ - Z_FAR;
  return Z_FAR + (((raw % Z_RANGE) + Z_RANGE) % Z_RANGE);
};

// ── DOF & fade ─────────────────────────────────────────────────

// Part 13 — non-monotonic Z-blur:
//   far plates:   atmospheric haze (4px)
//   focus plane:  0px
//   near plates:  heavy bokeh (15px)
const computeDOFBlur = (renderedZ: number): number => {
  const atmo = interpolate(
    renderedZ,
    [Z_FAR, FOCUS_Z],
    [FAR_ATMO_BLUR, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const near = interpolate(
    renderedZ,
    [FOCUS_Z, Z_NEAR],
    [0, NEAR_BLUR_MAX],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return Math.max(atmo, near);
};

// Part 6 — plates emerge from the fog at the far end of the tunnel
const computeDepthFade = (renderedZ: number): number =>
  interpolate(renderedZ, [FAR_FADE_START, FAR_FADE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// ── Starfield (optional, for scenes with a visible sky) ────────

const Starfield: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => (
  <svg
    viewBox="0 0 1920 1080"
    preserveAspectRatio="xMidYMid slice"
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
  >
    {Array.from({ length: 80 }, (_, i) => {
      const cx = (i * 173.1) % 1920;
      const cy = (i * 97.7) % 540;
      const r = 0.5 + (i % 4) * 0.4;
      const tw = 0.4 + Math.sin((frame / fps) * 1.6 + i * 0.7) * 0.4;
      return (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="white"
          opacity={Math.max(0.1, tw)}
        />
      );
    })}
  </svg>
);

// ── Plate renderer ──────────────────────────────────────────────

const PlateView: React.FC<{
  plate: Plate;
  renderedZ: number;
  kit: SceneKit;
}> = ({ plate, renderedZ, kit }) => {
  const opacity = computeDepthFade(renderedZ);
  const blurPx = computeDOFBlur(renderedZ);

  // Each plate is a 300vw × 300vh div offset so that the viewport sits
  // at its dead center. At translateZ(0) it already overflows the frame
  // massively (forced vignette); at deep negative Z it shrinks via
  // perspective projection into a small "ring" framing the static sky.
  // There is no CSS `scale()` here — perspective alone does the work.
  return (
    <div
      style={{
        position: "absolute",
        left: "-100vw",
        top: "-100vh",
        width: "300vw",
        height: "300vh",
        transform: `translate3d(0px, 0px, ${renderedZ}px)`,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          opacity,
          filter: blurPx > 0.1 ? `blur(${blurPx.toFixed(1)}px)` : undefined,
          willChange: "opacity, filter",
        }}
      >
        {kit.buildPlateCutout({
          plateIndex: plate.id,
          plateCount: PLATE_COUNT,
          seed: plate.seed,
          width: NOMINAL_WIDTH,
          height: NOMINAL_HEIGHT,
        })}
      </div>
    </div>
  );
};

// ── Sub-object generation ───────────────────────────────────────
// Phase 9: interstitial particles that live BETWEEN the macro plates.
// They are individual divs at specific Z positions inside the same
// preserve-3d container as the plates. Each wraps via the same
// treadmill so they loop forever.

type SubObjectInstance = {
  specIndex: number;
  x: number;
  y: number;
  initialZ: number;
  variant: number;
  seed: number;
};

const makeSubObjects = (
  masterSeed: number,
  specs: SubObjectSpec[],
): SubObjectInstance[] => {
  const rand = mulberry32(masterSeed + 999);
  const out: SubObjectInstance[] = [];
  for (let si = 0; si < specs.length; si++) {
    const spec = specs[si];
    for (let i = 0; i < spec.count; i++) {
      const x = spec.xRange[0] + rand() * (spec.xRange[1] - spec.xRange[0]);
      const y = spec.yRange[0] + rand() * (spec.yRange[1] - spec.yRange[0]);
      const initialZ = Z_FAR + rand() * Z_RANGE;
      out.push({
        specIndex: si,
        x,
        y,
        initialZ,
        variant: Math.floor(rand() * 4),
        seed: Math.floor(rand() * 1_000_000),
      });
    }
  }
  return out;
};

const SubObjectView: React.FC<{
  obj: SubObjectInstance;
  renderedZ: number;
  specs: SubObjectSpec[];
}> = ({ obj, renderedZ, specs }) => {
  const opacity = computeDepthFade(renderedZ);
  const blurPx = computeDOFBlur(renderedZ);
  if (opacity < 0.01) return null;

  const Comp = specs[obj.specIndex].Component;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate3d(${obj.x}px, ${obj.y}px, ${renderedZ}px)`,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      <div
        style={{
          opacity,
          filter: blurPx > 0.1 ? `blur(${blurPx.toFixed(1)}px)` : undefined,
        }}
      >
        <Comp variant={obj.variant} seed={obj.seed} />
      </div>
    </div>
  );
};

// ── The factory ─────────────────────────────────────────────────

export const createFPVScene = (
  kit: SceneKit,
): React.FC<FPVSceneProps> => {
  const FPVScene: React.FC<FPVSceneProps> = ({
    durationInFrames,
    masterSeed = 1337,
  }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const plates = useMemo(
      () => makePlates(masterSeed),
      [masterSeed],
    );
    const subObjects = useMemo(
      () => (kit.subObjects ? makeSubObjects(masterSeed, kit.subObjects) : []),
      [masterSeed],
    );
    const cameraZ = computeCameraZ(frame, durationInFrames);

    // Drone physics — wobble, bank, buffet (Part 8)
    const camDriftX = Math.sin((frame / fps) * 1.2) * 35;
    const camDriftY = Math.cos((frame / fps) * 1.5) * 22;
    const buffet = Math.sin((frame / fps) * 7.1) * 5;
    const camBankDeg = -camDriftX * 0.25;

    // Y-axis reveal pan (Part 14) — supports per-scene override for swoops
    const effFrame = frame + FRAME_OFFSET;
    const effDuration = durationInFrames + FRAME_OFFSET;
    const panProgress = Math.min(1, effFrame / effDuration);
    const panY = kit.cameraYOverride
      ? kit.cameraYOverride(panProgress)
      : interpolate(
          panProgress,
          [0, 1],
          [VERTICAL_PAN_START_Y, VERTICAL_PAN_END_Y],
        );

    return (
      <AbsoluteFill
        style={{
          background: kit.palette.backgroundGradient,
          overflow: "hidden",
        }}
      >
        {kit.palette.showStarfield && <Starfield frame={frame} fps={fps} />}

        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${camDriftX}px, ${camDriftY + buffet + panY}px) rotate(${camBankDeg}deg)`,
            transformOrigin: "50% 50%",
            willChange: "transform",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              perspective: `${PERSPECTIVE_PX}px`,
              perspectiveOrigin: "50% 50%",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Macro plates */}
              {plates.map((plate) => (
                <PlateView
                  key={`plate-${plate.id}`}
                  plate={plate}
                  renderedZ={wrapZ(plate.initialZ, cameraZ)}
                  kit={kit}
                />
              ))}

              {/* Interstitial sub-objects (Phase 9) — same preserve-3d
                  context, same Z treadmill, same DOF/fade as plates */}
              {kit.subObjects &&
                subObjects.map((obj, idx) => (
                  <SubObjectView
                    key={`sub-${idx}`}
                    obj={obj}
                    renderedZ={wrapZ(obj.initialZ, cameraZ)}
                    specs={kit.subObjects!}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* Atmospheric haze */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, ${kit.palette.fogColor} 100%)`,
            pointerEvents: "none",
          }}
        />

        {/* Vignette */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)",
            pointerEvents: "none",
          }}
        />
      </AbsoluteFill>
    );
  };

  return FPVScene;
};

// ── Helper: build a standard "edge-framed" cutout ──────────────

/** Compute normalized depth for a plate.
 *  Returns 0 for the foreground plate (thickest borders, smallest hole)
 *  and 1 for the deepest plate (sparsest, biggest hole).
 */
export const plateDepth = (plateIndex: number, plateCount: number): number =>
  plateCount <= 1 ? 0 : plateIndex / (plateCount - 1);

/** Compute the size of the transparent central "flight hole" for a plate.
 *  Foreground plates get a small tight hole; deep plates get a large hole.
 */
export const plateHoleSize = (
  depth: number,
  width: number,
  height: number,
): { w: number; h: number } => ({
  w: width * (0.22 + depth * 0.28),  // 22% → 50% of viewport width
  h: height * (0.20 + depth * 0.30), // 20% → 50% of viewport height
});
