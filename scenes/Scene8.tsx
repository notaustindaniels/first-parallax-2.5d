/** Scene 8 — NIGHT SKY FINALE
 *  Pure black to deep blue. 60+ stars, nebula blob, pulsing north star, dark tree tops.
 *  Motion: biggest zoom (1.0 → 2.2), strongest upward drift −300 px. The camera flies into infinity.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ParallaxLayer } from "./ParallaxLayer";

const ZOOM_START = 1.0;
const ZOOM_END   = 2.2;
const DRIFT_X    = 0;
const DRIFT_Y    = -300;

// ── Sub-components ────────────────────────────────────────────

const Background: React.FC = () => (
  <div style={{ position:"absolute", inset:0,
    background: "linear-gradient(180deg,#000004 0%,#000a1e 30%,#000818 60%,#000408 100%)" }} />
);

const Stars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <svg viewBox="0 0 1920 1080"
      style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
      {Array.from({ length: 64 }, (_, i) => {
        const cx = ((i * 167.3 + 100) % 1900) + 10;
        const cy = ((i * 89.7  + 50)  % 900)  + 20;
        const r  = 0.6 + (i % 5) * 0.5;
        const base = 0.4 + (i % 7) * 0.08;
        const opacity = Math.max(0.05, Math.min(1,
          base + Math.sin(frame / fps * 1.8 + i * 0.72) * 0.3));
        return <circle key={i} cx={cx} cy={cy} r={r} fill="white" opacity={opacity} />;
      })}
    </svg>
  );
};

const Nebula: React.FC = () => (
  <svg viewBox="0 0 1920 1080"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <defs>
      <radialGradient id="neb1" cx="35%" cy="30%" r="30%">
        <stop offset="0%"   stopColor="#4020a0" stopOpacity={0.15} />
        <stop offset="60%"  stopColor="#2010a0" stopOpacity={0.08} />
        <stop offset="100%" stopColor="#1008a0" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="neb2" cx="65%" cy="40%" r="25%">
        <stop offset="0%"   stopColor="#200840" stopOpacity={0.12} />
        <stop offset="70%"  stopColor="#100428" stopOpacity={0.06} />
        <stop offset="100%" stopColor="#080214" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={670}  cy={324} rx={580} ry={330} fill="url(#neb1)" />
    <ellipse cx={1248} cy={432} rx={480} ry={270} fill="url(#neb2)" />
  </svg>
);

const NorthStar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 0.6 + Math.sin(frame / fps * 0.8) * 0.2;
  return (
    <svg viewBox="0 0 1920 1080"
      style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
      <defs>
        <radialGradient id="nstar" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="white"   stopOpacity={pulse} />
          <stop offset="40%"  stopColor="#c0d8ff" stopOpacity={pulse * 0.5} />
          <stop offset="100%" stopColor="#6090ff" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* Glow halo */}
      <circle cx={960} cy={200} r={60} fill="url(#nstar)" />
      {/* Star disc */}
      <circle cx={960} cy={200} r={5} fill="white" />
      {/* Cross flare */}
      <line x1={960} y1={188} x2={960} y2={212} stroke="white" strokeWidth={1.5}
        opacity={pulse * 0.8} />
      <line x1={948} y1={200} x2={972} y2={200} stroke="white" strokeWidth={1.5}
        opacity={pulse * 0.8} />
    </svg>
  );
};

const SilhouettedHills: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <polygon
      points="0,1080 0,880 300,780 600,840 960,760 1320,820 1620,770 1920,840 1920,1080"
      fill="#0a0a18" />
  </svg>
);

const TreeTops: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {Array.from({ length: 22 }, (_, i) => {
      const x   = (i / 22) * 1920 + ((i * 61) % 50) - 25;
      const h   = 80 + (i % 5) * 20;
      const w   = 24 + (i % 4) * 8;
      const tip = 1080 - h;
      const fill = i % 2 === 0 ? "#060610" : "#080814";
      return (
        <polygon key={i}
          points={`${x},${1080} ${x - w/2},${tip} ${x + w/2},${tip}`}
          fill={fill} />
      );
    })}
  </svg>
);

const Foreground: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <rect x={0} y={1020} width={1920} height={60} fill="#040408" />
    <rect x={0} y={1050} width={1920} height={30} fill="#020206" />
  </svg>
);

// ── Scene 8 ──────────────────────────────────────────────────

interface SceneProps { durationInFrames: number }

export const Scene8: React.FC<SceneProps> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.25, 1, 0.35, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lp = { progress, zoomStart: ZOOM_START, zoomEnd: ZOOM_END, driftX: DRIFT_X, driftY: DRIFT_Y };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000004", overflow: "hidden" }}>
      <div style={{ width:"100%", height:"100%", perspective: 800, perspectiveOrigin: "50% 55%" }}>
        <ParallaxLayer depth={0.0}  {...lp}><Background /></ParallaxLayer>
        <ParallaxLayer depth={0.15} {...lp}><Stars /></ParallaxLayer>
        <ParallaxLayer depth={0.25} {...lp}><Nebula /></ParallaxLayer>
        <ParallaxLayer depth={0.3}  {...lp}><NorthStar /></ParallaxLayer>
        <ParallaxLayer depth={0.6}  {...lp}><SilhouettedHills /></ParallaxLayer>
        <ParallaxLayer depth={0.85} {...lp}><TreeTops /></ParallaxLayer>
        <ParallaxLayer depth={1.0}  {...lp}><Foreground /></ParallaxLayer>
      </div>
      {/* Scene 8: 2-second fade-out at end */}
      <Audio
        src={staticFile("voiceover/scene8.mp3")}
        volume={(f) =>
          interpolate(f, [durationInFrames - 2 * fps, durationInFrames], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};
