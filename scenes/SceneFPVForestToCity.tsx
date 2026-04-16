/** SceneFPVForestToCity — Object Wipe + Whip Pan transition.
 *
 *  Phase 10: Real drone edit, not an expanding circle.
 *
 *  Architecture:
 *  1. Forest scene plays for the first 70% of the duration.
 *  2. In the last 10 frames of the forest, a MASSIVE dark tree trunk
 *     (500vw wide) at near-Z fills the entire viewport for 2-3 frames,
 *     acting as a natural blackout (the "object wipe").
 *  3. Simultaneously, a whip-pan starts: the camera slams translateX
 *     hard left with heavy horizontal motion blur.
 *  4. Hard cut: at the exact frame the trunk fills the screen, we
 *     switch from rendering forest to rendering city.
 *  5. City continues the whip momentum for 10 frames, decelerating,
 *     with matching horizontal blur that settles to zero.
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import { SceneFPVForest } from "./SceneFPVForest";
import { SceneFPVCityNight } from "./SceneFPVCityNight";

export type SceneFPVForestToCityProps = {
  durationInFrames: number;
  [key: string]: unknown;
};

// The wipe trunk: a massive dark shape that fills the screen at Z near
// the camera. It's 500vw wide and 300vh tall so even with perspective
// distortion it completely eclipses the 16:9 viewport.
const WipeTrunk: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: "-200vw",
      top: "-100vh",
      width: "500vw",
      height: "300vh",
      background: "#020306",
    }}
  />
);

const WHIP_DURATION = 10; // frames for the whip-pan on each side of the cut
const WHIP_AMOUNT_VW = 60; // how far the camera whips in vw units

export const SceneFPVForestToCity: React.FC<SceneFPVForestToCityProps> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cut point: forest plays until here, city starts here
  const cutFrame = Math.floor(durationInFrames * 0.68);

  // Forest half duration and city half duration
  const forestDuration = cutFrame + WHIP_DURATION; // forest renders a bit past cut for the wipe
  const cityDuration = durationInFrames - cutFrame + WHIP_DURATION;

  const isForest = frame < cutFrame;

  // ── Whip-pan calculation ──────────────────────────────────────
  // Forest exit whip: last WHIP_DURATION frames before cut, slam LEFT
  const forestWhipStart = cutFrame - WHIP_DURATION;
  const forestWhip =
    frame >= forestWhipStart && frame < cutFrame
      ? interpolate(frame, [forestWhipStart, cutFrame], [0, -WHIP_AMOUNT_VW], {
          easing: Easing.bezier(0.7, 0, 1, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  // City entry whip: first WHIP_DURATION frames after cut, momentum continues
  // from -WHIP_AMOUNT then snaps back to 0
  const cityWhipEnd = cutFrame + WHIP_DURATION;
  const cityWhip =
    frame >= cutFrame && frame < cityWhipEnd
      ? interpolate(frame, [cutFrame, cityWhipEnd], [-WHIP_AMOUNT_VW, 0], {
          easing: Easing.bezier(0, 0, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  const whipX = isForest ? forestWhip : cityWhip;

  // Motion blur tied to whip magnitude
  const blurPx = Math.abs(whipX) * 0.5;

  // ── Wipe trunk: appears during the last few frames before cut ──
  // Position the trunk at a Z that's close to the camera so it's massive.
  // With perspective=1000 and Z=600, scale = 1000/400 = 2.5x.
  // The trunk is 500vw × 300vh, so visual size = 1250vw × 750vh.
  // That's guaranteed to fill any viewport.
  const showWipeTrunk =
    frame >= cutFrame - 3 && frame <= cutFrame + 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#020306" }}>
      {/* ── Scene layers — both always in the DOM, Sequence handles timing ── */}
      <AbsoluteFill
        style={{
          transform: `translateX(${whipX}vw)`,
          filter: blurPx > 0.5 ? `blur(${blurPx.toFixed(1)}px)` : undefined,
          willChange: "transform, filter",
        }}
      >
        {/* Forest plays from frame 0 through a few frames past the cut */}
        <Sequence from={0} durationInFrames={cutFrame + 3} layout="none">
          <SceneFPVForest durationInFrames={cutFrame + 3} />
        </Sequence>

        {/* City starts at the cut frame and runs to the end */}
        <Sequence
          from={cutFrame}
          durationInFrames={durationInFrames - cutFrame}
          layout="none"
        >
          <SceneFPVCityNight
            durationInFrames={durationInFrames - cutFrame}
          />
        </Sequence>
      </AbsoluteFill>

      {/* ── Object wipe: massive dark trunk fills the viewport for 2-3 frames ── */}
      {showWipeTrunk && (
        <AbsoluteFill
          style={{
            perspective: "1000px",
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
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate3d(0px, 0px, 600px)",
                transformStyle: "preserve-3d",
              }}
            >
              <WipeTrunk />
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
