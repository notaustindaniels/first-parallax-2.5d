/** Scene 6 — COASTAL CLIFFS
 *  Storm gray-to-white. Distant rock stacks, cliff face, layered breaking waves.
 *  Motion: diagonal push opposite direction (driftY −180, driftX +80).
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ParallaxLayer } from "./ParallaxLayer";

const ZOOM_START = 1.0;
const ZOOM_END   = 1.8;
const DRIFT_X    = 80;
const DRIFT_Y    = -180;

// ── Sub-components ────────────────────────────────────────────

const Background: React.FC = () => (
  <div style={{ position:"absolute", inset:0,
    background: "linear-gradient(180deg,#2a3a4a 0%,#3a4a58 25%,#6a7a88 55%,#a0aeb8 80%,#c8d4dc 100%)" }} />
);

const RockStacks: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <polygon points="200,850  170,700  230,680  260,720  240,850" fill="#3a4a54" />
    <polygon points="280,860  260,740  310,720  340,750  330,860" fill="#3a4a54" />
    <polygon points="1640,840 1610,720 1670,700 1700,740 1685,840" fill="#3a4a54" />
    <polygon points="1720,855 1700,750 1760,730 1790,770 1780,855" fill="#3a4a54" />
  </svg>
);

const CliffFace: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {/* Main cliff mass */}
    <polygon
      points="1920,0 1920,1080 900,1080 800,900 760,700 820,500 900,350 980,200 1100,80 1300,20 1920,0"
      fill="#3a4a5a" />
    {/* Cliff face texture lines */}
    <polygon
      points="1920,0 1920,1080 950,1080 850,900 800,700 860,500 940,360"
      fill="#2e3c4a" />
  </svg>
);

const Waves: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <svg viewBox="0 0 1920 1080"
      style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
      {/* Wave 1 — far, subtle */}
      <path
        d={`M0,${860 + Math.sin(t * 0.8) * 8}
            Q240,${830 + Math.sin(t * 0.8 + 1) * 10}
              480,${860 + Math.sin(t * 0.8 + 2) * 8}
            Q720,${885 + Math.sin(t * 0.8 + 3) * 10}
              960,${860 + Math.sin(t * 0.8 + 4) * 8}
            Q1200,${840 + Math.sin(t * 0.8 + 5) * 10}
              1920,${855 + Math.sin(t * 0.8 + 6) * 8}
            L1920,900 L0,900 Z`}
        fill="white" opacity={0.12} />
      {/* Wave 2 — mid */}
      <path
        d={`M0,${900 + Math.sin(t * 1.1 + 0.5) * 12}
            Q320,${875 + Math.sin(t * 1.1 + 1.5) * 14}
              640,${905 + Math.sin(t * 1.1 + 2.5) * 12}
            Q960,${920 + Math.sin(t * 1.1 + 3.5) * 14}
              1280,${900 + Math.sin(t * 1.1 + 4.5) * 12}
            Q1600,${880 + Math.sin(t * 1.1 + 5.5) * 10}
              1920,${895 + Math.sin(t * 1.1) * 8}
            L1920,960 L0,960 Z`}
        fill="white" opacity={0.22} />
      {/* Wave 3 — close, bright */}
      <path
        d={`M0,${940 + Math.sin(t * 1.4 + 1) * 14}
            Q240,${920 + Math.sin(t * 1.4 + 2) * 16}
              480,${945 + Math.sin(t * 1.4 + 3) * 14}
            Q720,${960 + Math.sin(t * 1.4 + 4) * 16}
              960,${940 + Math.sin(t * 1.4 + 5) * 14}
            Q1200,${925 + Math.sin(t * 1.4 + 6) * 12}
              1920,${935 + Math.sin(t * 1.4) * 10}
            L1920,1020 L0,1020 Z`}
        fill="white" opacity={0.35} />
    </svg>
  );
};

const CliffEdge: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {/* Dark cliff from bottom-left */}
    <polygon points="0,1080 0,600 80,580 200,640 320,700 400,800 380,1080" fill="#1a2028" />
    {/* Grass tufts on cliff top */}
    {[60, 100, 150, 200, 260].map((x, i) => (
      <g key={i}>
        <line x1={x} y1={640 - i*10} x2={x-8} y2={608 - i*10} stroke="#2a4020" strokeWidth={3} />
        <line x1={x+6} y1={640 - i*10} x2={x+12} y2={604 - i*10} stroke="#2a4020" strokeWidth={3} />
      </g>
    ))}
  </svg>
);

const Foreground: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <rect x={0} y={1020} width={460} height={60} fill="#141820" />
    <rect x={0} y={1040} width={1920} height={40} fill="#0e121a" />
  </svg>
);

// ── Scene 6 ──────────────────────────────────────────────────

interface SceneProps { durationInFrames: number }

export const Scene6: React.FC<SceneProps> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.25, 1, 0.35, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lp = { progress, zoomStart: ZOOM_START, zoomEnd: ZOOM_END, driftX: DRIFT_X, driftY: DRIFT_Y };

  return (
    <AbsoluteFill style={{ backgroundColor: "#2a3a4a", overflow: "hidden" }}>
      <div style={{ width:"100%", height:"100%", perspective: 800, perspectiveOrigin: "50% 55%" }}>
        <ParallaxLayer depth={0.0}  {...lp}><Background /></ParallaxLayer>
        <ParallaxLayer depth={0.2}  {...lp}><RockStacks /></ParallaxLayer>
        <ParallaxLayer depth={0.4}  {...lp}><CliffFace /></ParallaxLayer>
        <ParallaxLayer depth={0.55} {...lp}><Waves /></ParallaxLayer>
        <ParallaxLayer depth={0.75} {...lp}><CliffEdge /></ParallaxLayer>
        <ParallaxLayer depth={1.0}  {...lp}><Foreground /></ParallaxLayer>
      </div>
      <Audio src={staticFile("voiceover/scene6.mp3")} />
    </AbsoluteFill>
  );
};
