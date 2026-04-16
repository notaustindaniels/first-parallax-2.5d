/** SceneFPVForestToCity — zoom-through portal transition.
 *
 *  Architecture: the city scene is always rendering as a background
 *  layer. The forest scene is rendered on top of it with a radial mask.
 *  For most of the shot, the mask is fully opaque (forest fully visible).
 *  In the final third of the shot, a jagged black hole at the center
 *  of the mask grows outward from zero radius to engulf the whole
 *  viewport, "opening up" the forest plate and revealing the city
 *  rendering underneath.
 *
 *  Implements Part 10 (whip / portal transitions) of fpv-drone-parallax.md
 *  in its "portal scale-through" variant: instead of a horizontal whip,
 *  the transition is an in/out through a specific deep plate.
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SceneFPVCityNight } from "./SceneFPVCityNight";
import { SceneFPVForest } from "./SceneFPVForest";

export type SceneFPVForestToCityProps = {
  durationInFrames: number;
  [key: string]: unknown;
};

const TRANSITION_START_FRACTION = 0.62;
const TRANSITION_END_FRACTION = 0.98;

const jaggedPortalPath = (cx: number, cy: number, r: number): string => {
  // 16-point star with alternating radii, offset per segment for jagged
  // organic feel. The resulting <path> is the boundary of the hole.
  const points = 16;
  const parts: string[] = [];
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * Math.PI * 2 - Math.PI / 2;
    const rr = r * (i % 2 === 0 ? 1.1 : 0.82) * (0.9 + Math.sin(i * 2.3) * 0.12);
    const x = cx + Math.cos(theta) * rr;
    const y = cy + Math.sin(theta) * rr;
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  parts.push("Z");
  return parts.join(" ");
};

export const SceneFPVForestToCity: React.FC<SceneFPVForestToCityProps> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const transitionStart = Math.floor(durationInFrames * TRANSITION_START_FRACTION);
  const transitionEnd = Math.floor(durationInFrames * TRANSITION_END_FRACTION);

  // Portal progress 0..1 over the transition window, with ease-in curve
  // (slow start then accelerating engulf).
  const portalProgress = interpolate(
    frame,
    [transitionStart, transitionEnd],
    [0, 1],
    {
      easing: Easing.bezier(0.55, 0, 0.85, 0.25),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Portal hole radius — grows from 0 to a value large enough to cover
  // the viewport diagonal.
  const maxRadius = Math.hypot(width, height) * 0.75;
  const holeRadius = portalProgress * maxRadius;

  // Forest layer opacity — fully visible until transitionEnd, then fade
  // out over the last few frames.
  const forestOpacity = interpolate(
    frame,
    [transitionEnd - 10, transitionEnd + 2],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // CSS radial-gradient mask. Inside the inner radius the forest
  // becomes transparent, revealing the city below; outside the outer
  // radius the forest is fully visible. The band between them is the
  // feathered edge of the "portal hole."
  const maskInner = Math.max(0, holeRadius - 30);
  const maskOuter = holeRadius + 20;
  const maskImage =
    holeRadius > 2
      ? `radial-gradient(circle at 50% 50%, transparent 0px, transparent ${maskInner.toFixed(0)}px, black ${maskOuter.toFixed(0)}px, black 100%)`
      : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Bottom layer: city scene, always rendering */}
      <AbsoluteFill>
        <SceneFPVCityNight durationInFrames={durationInFrames} />
      </AbsoluteFill>

      {/* Top layer: forest, with a growing radial mask hole at center.
          The hole reveals the city underneath as the mask grows. */}
      <AbsoluteFill
        style={{
          opacity: forestOpacity,
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      >
        <SceneFPVForest durationInFrames={durationInFrames} />
      </AbsoluteFill>

      {/* Jagged black portal rim — draws the organic edge of the hole
          so the cut isn't just a soft circle. */}
      {holeRadius > 4 && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid slice"
            style={{ width: "100%", height: "100%" }}
          >
            <path
              d={jaggedPortalPath(width / 2, height / 2, holeRadius + 12)}
              fill="none"
              stroke="#000"
              strokeWidth={18}
              opacity={0.65}
            />
          </svg>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
