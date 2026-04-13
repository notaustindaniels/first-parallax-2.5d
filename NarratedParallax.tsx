/** NarratedParallax — 8-scene 2.5D parallax composition
 *  calculateMetadata measures voiceover audio to set scene durations dynamically.
 *  Falls back to 135 frames (~4.5 s) per scene when audio is not yet generated.
 */
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { LightLeak } from "@remotion/light-leaks";

import { getAudioDuration } from "./getAudioDuration";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";
import { Scene6 } from "./scenes/Scene6";
import { Scene7 } from "./scenes/Scene7";
import { Scene8 } from "./scenes/Scene8";

// ── Types ─────────────────────────────────────────────────────

// Must include index signature to satisfy Remotion's Record<string, unknown> constraint
export type NarratedParallaxProps = {
  sceneDurations: number[];
  [key: string]: unknown;
};

// ── Constants ─────────────────────────────────────────────────

const FPS = 30;
const FALLBACK_FRAMES = 135; // 4.5 s per scene when no audio
const FADE_FRAMES = 20;      // overlap for each fade transition
const NUM_FADES = 5;         // transitions between scenes 1-2, 2-3, 3-4, 5-6, 6-7

// ── calculateMetadata ─────────────────────────────────────────

export const calculateMetadata = async () => {
  const durations = await Promise.all(
    Array.from({ length: 8 }, async (_, i) => {
      const src = staticFile(`voiceover/scene${i + 1}.mp3`);
      try {
        const secs = await getAudioDuration(src);
        return Math.round(secs * FPS);
      } catch {
        return FALLBACK_FRAMES;
      }
    }),
  );

  const total = durations.reduce((a, b) => a + b, 0) - NUM_FADES * FADE_FRAMES;

  return {
    durationInFrames: Math.max(total, 60),
    props: { sceneDurations: durations },
  };
};

// ── Main component ────────────────────────────────────────────

export const NarratedParallax: React.FC<NarratedParallaxProps> = ({ sceneDurations }) => {
  const frame = useCurrentFrame();
  const [s1, s2, s3, s4, s5, s6, s7, s8] = sceneDurations;

  // Film grain — seed cycles every 2 frames for a natural flutter
  const seed = Math.floor(frame / 2) % 12;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' seed='${seed}'/><feColorMatrix type='saturate' values='0'/></filter><rect width='256' height='256' filter='url(#g)'/></svg>`;
  const grainUrl = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>

      {/* ── 8 scenes wired with TransitionSeries ── */}
      <TransitionSeries>

        {/* Scene 1 — Starfield Mountains */}
        <TransitionSeries.Sequence durationInFrames={s1}>
          <Scene1 durationInFrames={s1} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_FRAMES })}
        />

        {/* Scene 2 — River Canyon */}
        <TransitionSeries.Sequence durationInFrames={s2}>
          <Scene2 durationInFrames={s2} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_FRAMES })}
        />

        {/* Scene 3 — Lantern Alley */}
        <TransitionSeries.Sequence durationInFrames={s3}>
          <Scene3 durationInFrames={s3} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_FRAMES })}
        />

        {/* Scene 4 — City Skyline (reverse zoom) */}
        <TransitionSeries.Sequence durationInFrames={s4}>
          <Scene4 durationInFrames={s4} />
        </TransitionSeries.Sequence>

        {/* LightLeak bridge: centered on the S4/S5 cut */}
        <TransitionSeries.Overlay durationInFrames={30}>
          <LightLeak seed={3} hueShift={30} />
        </TransitionSeries.Overlay>

        {/* Scene 5 — Forest Floor */}
        <TransitionSeries.Sequence durationInFrames={s5}>
          <Scene5 durationInFrames={s5} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_FRAMES })}
        />

        {/* Scene 6 — Coastal Cliffs */}
        <TransitionSeries.Sequence durationInFrames={s6}>
          <Scene6 durationInFrames={s6} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_FRAMES })}
        />

        {/* Scene 7 — Desert Dunes */}
        <TransitionSeries.Sequence durationInFrames={s7}>
          <Scene7 durationInFrames={s7} />
        </TransitionSeries.Sequence>

        {/* LightLeak bridge: centered on the S7/S8 cut */}
        <TransitionSeries.Overlay durationInFrames={30}>
          <LightLeak seed={7} hueShift={200} />
        </TransitionSeries.Overlay>

        {/* Scene 8 — Night Sky Finale */}
        <TransitionSeries.Sequence durationInFrames={s8}>
          <Scene8 durationInFrames={s8} />
        </TransitionSeries.Sequence>

      </TransitionSeries>

      {/* ── Post-processing overlays ── */}

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Film grain */}
      <AbsoluteFill
        style={{
          backgroundImage: grainUrl,
          backgroundRepeat: "repeat",
          opacity: 0.03,
          pointerEvents: "none",
        }}
      />

      {/* Warm wash */}
      <AbsoluteFill
        style={{
          background: "rgba(255,180,100,0.04)",
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />

    </AbsoluteFill>
  );
};
