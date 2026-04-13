/** Scene 2 — RIVER CANYON
 *  Coral-to-slate dusk palette. Canyon walls frame a glowing river.
 *  Motion: lateral pan right-to-left (driftX −180 px), mild upward drift.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ParallaxLayer } from "./ParallaxLayer";

const ZOOM_START = 1.0;
const ZOOM_END   = 1.5;
const DRIFT_X    = -180;
const DRIFT_Y    = -80;

// ── Sub-components ────────────────────────────────────────────

const Background: React.FC = () => (
  <div style={{ position:"absolute", inset:0,
    background: "linear-gradient(180deg,#d4603a 0%,#c04828 20%,#8a4838 45%,#4a3848 70%,#1a1828 100%)" }} />
);

const FarCanyonLeft: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <polygon points="0,0 0,1080 520,1080 380,600 300,300 200,100" fill="#3a2018" />
    <polygon points="0,0 0,1080 420,1080 310,640 240,350" fill="#2e1810" />
  </svg>
);

const FarCanyonRight: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <polygon points="1920,0 1920,1080 1380,1080 1520,620 1620,280 1780,80" fill="#3a2018" />
  </svg>
);

const River: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Animate a gradient offset to simulate water flow
  const flowOffset = (frame / fps * 40) % 200;
  return (
    <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
      style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
      <defs>
        <linearGradient id="river" x1={0} y1={0} x2={0} y2={1} gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#4a90b8" stopOpacity={0.9} />
          <stop offset="40%" stopColor="#3a7aa0" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#2a5878" stopOpacity={0.9} />
        </linearGradient>
        <linearGradient id="riverFlow" x1={0} x2={0} gradientUnits="userSpaceOnUse"
          y1={600 - flowOffset} y2={1080 - flowOffset}>
          <stop offset="0%" stopColor="#6ab0d0" stopOpacity={0.5} />
          <stop offset="50%" stopColor="#4a90b0" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#6ab0d0" stopOpacity={0.5} />
        </linearGradient>
      </defs>
      {/* River bed */}
      <polygon points="560,1080 640,600 700,500 900,480 1220,500 1280,600 1360,1080"
        fill="url(#river)" />
      {/* Flow shimmer */}
      <polygon points="600,1080 660,620 720,540 900,520 1200,540 1260,620 1320,1080"
        fill="url(#riverFlow)" />
    </svg>
  );
};

const NearCanyonLeft: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <polygon points="0,0 0,1080 480,1080 360,700 260,400 150,100 0,0" fill="#2a1810" />
  </svg>
);

const NearCanyonRight: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <polygon points="1920,0 1920,1080 1440,1080 1560,720 1680,400 1820,100" fill="#261408" />
  </svg>
);

const Rocks: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <polygon points="560,1080 540,980 610,960 660,1000 650,1080" fill="#1e0e08" />
    <polygon points="1260,1080 1250,970 1340,950 1380,990 1370,1080" fill="#1e0e08" />
    <polygon points="700,1080 680,1020 760,1000 800,1040 790,1080" fill="#1a0c06" />
  </svg>
);

const Foreground: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {/* Ground strip */}
    <rect x={0} y={1010} width={1920} height={70} fill="#140a04" />
    {/* Branch silhouette from left */}
    <path d="M0,820 Q80,780 160,820 Q200,800 240,760 Q260,720 300,700"
      stroke="#0a0604" strokeWidth={18} fill="none" />
    <path d="M160,820 Q180,790 210,770 Q230,750 220,720"
      stroke="#0a0604" strokeWidth={10} fill="none" />
    <path d="M240,760 Q270,740 280,710"
      stroke="#0a0604" strokeWidth={7} fill="none" />
  </svg>
);

// ── Scene 2 ──────────────────────────────────────────────────

interface SceneProps { durationInFrames: number }

export const Scene2: React.FC<SceneProps> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.25, 1, 0.35, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lp = { progress, zoomStart: ZOOM_START, zoomEnd: ZOOM_END, driftX: DRIFT_X, driftY: DRIFT_Y };

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1828", overflow: "hidden" }}>
      <div style={{ width:"100%", height:"100%", perspective: 800, perspectiveOrigin: "50% 55%" }}>
        <ParallaxLayer depth={0.0}  {...lp}><Background /></ParallaxLayer>
        <ParallaxLayer depth={0.2}  {...lp}><FarCanyonLeft /></ParallaxLayer>
        <ParallaxLayer depth={0.2}  {...lp}><FarCanyonRight /></ParallaxLayer>
        <ParallaxLayer depth={0.35} {...lp}><River /></ParallaxLayer>
        <ParallaxLayer depth={0.55} {...lp}><NearCanyonLeft /></ParallaxLayer>
        <ParallaxLayer depth={0.7}  {...lp}><NearCanyonRight /></ParallaxLayer>
        <ParallaxLayer depth={0.85} {...lp}><Rocks /></ParallaxLayer>
        <ParallaxLayer depth={1.0}  {...lp}><Foreground /></ParallaxLayer>
      </div>
      <Audio src={staticFile("voiceover/scene2.mp3")} />
    </AbsoluteFill>
  );
};
