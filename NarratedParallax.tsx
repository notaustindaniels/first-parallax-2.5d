/** NarratedParallax — 8-scene 2.5D parallax composition
 *  calculateMetadata measures voiceover audio to set scene durations dynamically.
 *  Falls back to 135 frames per scene when audio is absent.
 *
 *  Audio is hoisted out of Scene components into this file so that crossfade
 *  transitions don't cause overlapping narration. Each scene's <Audio> is
 *  wrapped in a <Sequence> with a calculated offset that accounts for the
 *  transition overlap subtraction.
 */
import React from "react";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
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

export type NarratedParallaxProps = {
  sceneDurations: number[];
  [key: string]: unknown;
};

export type SceneDebugProps = {
  sceneIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  [key: string]: unknown;
};

// ── Constants ─────────────────────────────────────────────────

const FPS = 30;
const FALLBACK_FRAMES = 135;

// Transition subtract-frames before each scene i (0-indexed). Overlays don't subtract.
// Cuts:  1→2 fade 12 · 2→3 slide 10 · 3→4 fade 12 · 4→5 overlay · 5→6 fade 12 · 6→7 slide 10 · 7→8 overlay
const TRANSITION_BEFORE: readonly number[] = [0, 12, 10, 12, 0, 12, 10, 0];
const TRANSITION_OVERLAP_TOTAL = TRANSITION_BEFORE.reduce((a, b) => a + b, 0); // 56

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

  const total = durations.reduce((a, b) => a + b, 0) - TRANSITION_OVERLAP_TOTAL;

  return {
    durationInFrames: Math.max(total, 60),
    props: { sceneDurations: durations },
  };
};

// ── Helpers ───────────────────────────────────────────────────

const buildAudioStarts = (sceneDurations: number[]): number[] => {
  const starts: number[] = [];
  let cursor = 0;
  for (let i = 0; i < 8; i++) {
    cursor -= TRANSITION_BEFORE[i];
    starts.push(cursor);
    cursor += sceneDurations[i];
  }
  return starts;
};

const grainDataUrl = (seed: number) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' seed='${seed}'/><feColorMatrix type='saturate' values='0'/></filter><rect width='256' height='256' filter='url(#g)'/></svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
};

// ── Main component ────────────────────────────────────────────

export const NarratedParallax: React.FC<NarratedParallaxProps> = ({ sceneDurations }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [s1, s2, s3, s4, s5, s6, s7, s8] = sceneDurations;
  const audioStarts = buildAudioStarts(sceneDurations);
  const grainUrl = grainDataUrl(Math.floor(frame / 2) % 12);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* ── Visual: 8 scenes wired with TransitionSeries ── */}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={s1}>
          <Scene1 durationInFrames={s1} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        <TransitionSeries.Sequence durationInFrames={s2}>
          <Scene2 durationInFrames={s2} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 10 })}
        />

        <TransitionSeries.Sequence durationInFrames={s3}>
          <Scene3 durationInFrames={s3} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        <TransitionSeries.Sequence durationInFrames={s4}>
          <Scene4 durationInFrames={s4} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Overlay durationInFrames={25}>
          <LightLeak seed={3} hueShift={30} />
        </TransitionSeries.Overlay>

        <TransitionSeries.Sequence durationInFrames={s5}>
          <Scene5 durationInFrames={s5} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        <TransitionSeries.Sequence durationInFrames={s6}>
          <Scene6 durationInFrames={s6} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: 10 })}
        />

        <TransitionSeries.Sequence durationInFrames={s7}>
          <Scene7 durationInFrames={s7} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Overlay durationInFrames={25}>
          <LightLeak seed={7} hueShift={200} />
        </TransitionSeries.Overlay>

        <TransitionSeries.Sequence durationInFrames={s8}>
          <Scene8 durationInFrames={s8} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* ── Audio: hoisted per-scene voiceover tracks ── */}
      <Sequence from={audioStarts[0]} premountFor={fps}>
        <Audio
          src={staticFile("voiceover/scene1.mp3")}
          volume={(f) =>
            interpolate(f, [0, 1 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      </Sequence>
      <Sequence from={audioStarts[1]} premountFor={fps}>
        <Audio src={staticFile("voiceover/scene2.mp3")} />
      </Sequence>
      <Sequence from={audioStarts[2]} premountFor={fps}>
        <Audio src={staticFile("voiceover/scene3.mp3")} />
      </Sequence>
      <Sequence from={audioStarts[3]} premountFor={fps}>
        <Audio src={staticFile("voiceover/scene4.mp3")} />
      </Sequence>
      <Sequence from={audioStarts[4]} premountFor={fps}>
        <Audio src={staticFile("voiceover/scene5.mp3")} />
      </Sequence>
      <Sequence from={audioStarts[5]} premountFor={fps}>
        <Audio src={staticFile("voiceover/scene6.mp3")} />
      </Sequence>
      <Sequence from={audioStarts[6]} premountFor={fps}>
        <Audio src={staticFile("voiceover/scene7.mp3")} />
      </Sequence>
      <Sequence from={audioStarts[7]} premountFor={fps}>
        <Audio
          src={staticFile("voiceover/scene8.mp3")}
          volume={(f) =>
            interpolate(f, [s8 - 2 * fps, s8], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      </Sequence>

      {/* ── Post-processing overlays ── */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.65) 100%)",
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: grainUrl,
          backgroundRepeat: "repeat",
          opacity: 0.03,
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          background: "rgba(255,170,80,0.03)",
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// ── SceneDebug: render a single scene at 135 frames for still verification ──

export const SceneDebug: React.FC<SceneDebugProps> = ({ sceneIndex }) => {
  const duration = FALLBACK_FRAMES;
  switch (sceneIndex) {
    case 1:
      return <Scene1 durationInFrames={duration} />;
    case 2:
      return <Scene2 durationInFrames={duration} />;
    case 3:
      return <Scene3 durationInFrames={duration} />;
    case 4:
      return <Scene4 durationInFrames={duration} />;
    case 5:
      return <Scene5 durationInFrames={duration} />;
    case 6:
      return <Scene6 durationInFrames={duration} />;
    case 7:
      return <Scene7 durationInFrames={duration} />;
    case 8:
      return <Scene8 durationInFrames={duration} />;
    default:
      return null;
  }
};
