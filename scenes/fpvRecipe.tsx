/** fpvRecipe.tsx — Cutout-plate FPV drone scene recipe.
 *
 *  ARCHITECTURE:
 *  A scene is a stack of 5–7 flat "painted cutout" plates at varying Z.
 *  Each plate is ONE full-viewport SVG cutout — a dense silhouette with a
 *  transparent hole near the center that the camera flies through.
 *
 *  This is a Disney multiplane camera in CSS 3D. Plates at different Z
 *  values create depth through occlusion and perspective projection.
 *
 *  --- CRITICAL FIX (Phase 11): Z-NEAR CULL ---
 *  In CSS 3D, when an element's translateZ approaches the `perspective` value
 *  of its ancestor, the projection scale → infinity and the browser clips
 *  geometry unpredictably. Any plate or sub-object whose renderedZ enters
 *  the NEAR_CULL_ZONE is opacity-faded to zero over a small Z-window
 *  BEFORE it mathematically crashes the lens. This eliminates the pops
 *  and tearing that the user correctly identified.
 *
 *  Implements the rules from fpv-drone-parallax.md:
 *   - Part 1   CSS 3D perspective
 *   - Part 4   Plate treadmill with wrap-around
 *   - Part 5   Mid-flight start + exponential ramp
 *   - Part 6   Depth fade from the fog
 *   - Part 8   Drone wobble & bank
 *   - Part 11  Z-near cull (new)
 *   - Part 13  Cinematic depth of field (non-monotonic Z-blur)
 *   - Part 14  Y-axis reveal pan
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
  plateIndex: number;
  plateCount: number;
  seed: number;
  width: number;
  height: number;
};

export type PlateCutoutFn = (props: PlateCutoutProps) => React.ReactNode;

export type ScenePalette = {
  backgroundGradient: string;
  fogColor: string;
  showStarfield: boolean;
};

export type SubObjectSpec = {
  Component: React.FC<{ variant: number; seed: number }>;
  count: number;
  xRange: [number, number];
  yRange: [number, number];
};

export type SceneKit = {
  palette: ScenePalette;
  buildPlateCutout: PlateCutoutFn;
  subObjects?: SubObjectSpec[];
  cameraYOverride?: (panProgress: number) => number;
  /** Optional Z-offset applied to every plate and sub-object. Used by the
   *  portal transition to park the city scene deep behind the forest
   *  without touching the shared treadmill math. */
  zOffset?: number;
  /** Disable the plate wrap-around treadmill. Used by the portal transition
   *  so the city doesn't cycle — it just sits there waiting to be revealed. */
  disableWrap?: boolean;
};

export type FPVSceneProps = {
  durationInFrames: number;
  masterSeed?: number;
  [key: string]: unknown;
};

// ── Constants ───────────────────────────────────────────────────

const PLATE_COUNT = 6;
const PLATE_Z_SPACING = 2000;
const Z_RANGE = PLATE_COUNT * PLATE_Z_SPACING;
const Z_NEAR = 700;
const Z_FAR = Z_NEAR - Z_RANGE;

// Perspective — Part 1
const PERSPECTIVE_PX = 1200;

// Z-near cull — Phase 11 fix
// The cull zone starts where objects begin to bloat uncomfortably (~40%
// of perspective away from camera) and fully fades by the time they'd
// mathematically intersect the lens (~17% of perspective away).
// At Z = NEAR_CULL_START (480), projection scale ≈ 1200/(1200-480) = 1.67x
// At Z = NEAR_CULL_END   (900), projection scale ≈ 1200/(1200-900) = 4.00x
// So we fade from "zoomed but sharp" to "gone" across a 420px window
// BEFORE the browser's near-plane kicks in.
const NEAR_CULL_START = 480;
const NEAR_CULL_END = 900;

// Camera ramp — Part 5
const FRAME_OFFSET = 60;
const BASE_SPEED = 18;
const RAMP_TOTAL = 6000;
const EASE_EXPONENT = 2.2;

// Far fade — Part 6
const FAR_FADE_START = Z_FAR + 500;
const FAR_FADE_END = Z_FAR + 4000;

// Cinematic DOF — Part 13
const FOCUS_Z = -2500;
const FAR_ATMO_BLUR = 4;
const NEAR_BLUR_MAX = 15;

// Y-axis reveal — Part 14
const VERTICAL_PAN_START_Y = -180;
const VERTICAL_PAN_END_Y = 120;

const NOMINAL_WIDTH = 1920;
const NOMINAL_HEIGHT = 1080;

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
    const initialZ = -500 - i * PLATE_Z_SPACING;
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

const wrapZ = (initialZ: number, cameraZ: number): number => {
  const raw = initialZ + cameraZ - Z_FAR;
  return Z_FAR + (((raw % Z_RANGE) + Z_RANGE) % Z_RANGE);
};

// ── DOF, fade, and cull ────────────────────────────────────────

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

const computeDepthFade = (renderedZ: number): number =>
  interpolate(renderedZ, [FAR_FADE_START, FAR_FADE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Phase 11: Z-near cull.
 *  Returns an opacity multiplier that rapidly fades an object as it
 *  approaches the camera's near plane. This runs BEFORE CSS would
 *  clip the geometry, eliminating the "pop-through" artifacts. */
const computeNearCull = (renderedZ: number): number =>
  interpolate(renderedZ, [NEAR_CULL_START, NEAR_CULL_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// ── Starfield ──────────────────────────────────────────────────

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
  const fadeOpacity = computeDepthFade(renderedZ);
  const cullOpacity = computeNearCull(renderedZ);
  const opacity = fadeOpacity * cullOpacity;
  const blurPx = computeDOFBlur(renderedZ);

  if (opacity < 0.005) return null;

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
  const fadeOpacity = computeDepthFade(renderedZ);
  const cullOpacity = computeNearCull(renderedZ);
  const opacity = fadeOpacity * cullOpacity;
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
    const zOffset = kit.zOffset ?? 0;

    // Drone physics
    const camDriftX = Math.sin((frame / fps) * 1.2) * 35;
    const camDriftY = Math.cos((frame / fps) * 1.5) * 22;
    const buffet = Math.sin((frame / fps) * 7.1) * 5;
    const camBankDeg = -camDriftX * 0.25;

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
              {plates.map((plate) => {
                const renderedZ = kit.disableWrap
                  ? plate.initialZ + cameraZ + zOffset
                  : wrapZ(plate.initialZ, cameraZ) + zOffset;
                return (
                  <PlateView
                    key={`plate-${plate.id}`}
                    plate={plate}
                    renderedZ={renderedZ}
                    kit={kit}
                  />
                );
              })}

              {kit.subObjects &&
                subObjects.map((obj, idx) => {
                  const renderedZ = kit.disableWrap
                    ? obj.initialZ + cameraZ + zOffset
                    : wrapZ(obj.initialZ, cameraZ) + zOffset;
                  return (
                    <SubObjectView
                      key={`sub-${idx}`}
                      obj={obj}
                      renderedZ={renderedZ}
                      specs={kit.subObjects!}
                    />
                  );
                })}
            </div>
          </div>
        </div>

        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, ${kit.palette.fogColor} 100%)`,
            pointerEvents: "none",
          }}
        />

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

// ── Helper ──────────────────────────────────────────────────────

export const plateDepth = (plateIndex: number, plateCount: number): number =>
  plateCount <= 1 ? 0 : plateIndex / (plateCount - 1);

export const plateHoleSize = (
  depth: number,
  width: number,
  height: number,
): { w: number; h: number } => ({
  w: width * (0.22 + depth * 0.28),
  h: height * (0.20 + depth * 0.30),
});

// ── Shared constants for the portal transition ─────────────────

export const FPV_CONSTANTS = {
  PLATE_COUNT,
  PLATE_Z_SPACING,
  Z_RANGE,
  Z_NEAR,
  Z_FAR,
  PERSPECTIVE_PX,
  NEAR_CULL_START,
  NEAR_CULL_END,
  FRAME_OFFSET,
  BASE_SPEED,
  RAMP_TOTAL,
  EASE_EXPONENT,
  NOMINAL_WIDTH,
  NOMINAL_HEIGHT,
};
