/** Scene 7 — DESERT DUNES
 *  Amber-to-white-hot gradient. Smooth dune bezier curves, cracked earth.
 *  Motion: pure horizontal sweep (driftX −200, no vertical drift).
 *  Special: sinusoidal heat distortion on mid dune layers.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ParallaxLayer } from "./ParallaxLayer";

const ZOOM_START = 1.0;
const ZOOM_END   = 1.6;
const DRIFT_X    = -200;
const DRIFT_Y    = 0;

// ── Sub-components ────────────────────────────────────────────

const Background: React.FC = () => (
  <div style={{ position:"absolute", inset:0,
    background: "linear-gradient(180deg,#fff8e0 0%,#f8d880 20%,#e8a830 55%,#c07818 80%,#904808 100%)" }} />
);

const Shimmer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = 0.1 + Math.sin(frame / fps * 2.1) * 0.08;
  return (
    <svg viewBox="0 0 1920 1080"
      style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
      {/* Heat shimmer band near horizon */}
      <rect x={0} y={420} width={1920} height={80} fill="#fff8e0" opacity={opacity} />
      <rect x={0} y={440} width={1920} height={40} fill="white" opacity={opacity * 0.5} />
    </svg>
  );
};

const FarDune: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <path
      d="M0,1080 L0,700 Q480,500 960,560 Q1440,620 1920,500 L1920,1080 Z"
      fill="#c88030" />
  </svg>
);

/** MidDune receives heat-distortion extraY from parent */
const MidDune: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <path
      d="M0,1080 L0,760 Q360,620 720,680 Q1080,740 1440,640 Q1680,580 1920,660 L1920,1080 Z"
      fill="#b06820" />
    <path
      d="M0,1080 L0,800 Q400,700 800,740 Q1200,780 1600,700 L1920,720 L1920,1080 Z"
      fill="#a05e18" opacity={0.5} />
  </svg>
);

const NearDune: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <path
      d="M0,1080 L0,840 Q240,780 480,820 Q720,860 960,800 Q1200,740 1440,810 Q1680,870 1920,820 L1920,1080 Z"
      fill="#905010" />
  </svg>
);

const CrackedEarth: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {/* Ground base */}
    <rect x={0} y={920} width={1920} height={160} fill="#7a3808" />
    {/* Crack pattern */}
    {Array.from({ length: 16 }, (_, i) => {
      const x = i * 120 + (i % 3) * 20;
      const y = 930 + (i % 4) * 20;
      return (
        <g key={i}>
          <polygon
            points={`${x},${y} ${x+60},${y+8} ${x+110},${y} ${x+100},${y+40} ${x+10},${y+35}`}
            fill="#6a2e04" />
          <line x1={x} y1={y} x2={x+55} y2={y+40} stroke="#5a2002" strokeWidth={1.5} />
          <line x1={x+60} y1={y+8} x2={x+40} y2={y+45} stroke="#5a2002" strokeWidth={1} />
        </g>
      );
    })}
  </svg>
);

const Foreground: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <rect x={0} y={1010} width={1920} height={70} fill="#4a1a04" />
    <rect x={0} y={1045} width={1920} height={35} fill="#3a1202" />
    {/* Dry crack lines */}
    {Array.from({ length: 8 }, (_, i) => (
      <line key={i} x1={100 + i * 240} y1={1010} x2={130 + i * 240} y2={1080}
        stroke="#5a2208" strokeWidth={2} />
    ))}
  </svg>
);

// ── Scene 7 ──────────────────────────────────────────────────

interface SceneProps { durationInFrames: number }

export const Scene7: React.FC<SceneProps> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.25, 1, 0.35, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Heat distortion: subtle sinusoidal vertical oscillation on mid layers
  const heatY = Math.sin(frame / fps * 1.8) * 3;

  const lp = { progress, zoomStart: ZOOM_START, zoomEnd: ZOOM_END, driftX: DRIFT_X, driftY: DRIFT_Y };

  return (
    <AbsoluteFill style={{ backgroundColor: "#904808", overflow: "hidden" }}>
      <div style={{ width:"100%", height:"100%", perspective: 800, perspectiveOrigin: "50% 55%" }}>
        <ParallaxLayer depth={0.0}  {...lp}><Background /></ParallaxLayer>
        <ParallaxLayer depth={0.2}  {...lp}><Shimmer /></ParallaxLayer>
        <ParallaxLayer depth={0.35} {...lp}><FarDune /></ParallaxLayer>
        <ParallaxLayer depth={0.55} {...lp} extraY={heatY}><MidDune /></ParallaxLayer>
        <ParallaxLayer depth={0.75} {...lp} extraY={heatY * 0.5}><NearDune /></ParallaxLayer>
        <ParallaxLayer depth={0.9}  {...lp}><CrackedEarth /></ParallaxLayer>
        <ParallaxLayer depth={1.0}  {...lp}><Foreground /></ParallaxLayer>
      </div>
      <Audio src={staticFile("voiceover/scene7.mp3")} />
    </AbsoluteFill>
  );
};
