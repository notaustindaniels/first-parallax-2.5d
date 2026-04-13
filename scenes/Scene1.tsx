/** Scene 1 — STARFIELD MOUNTAINS
 *  Indigo/purple sky, 42 twinkling stars, jagged mountain ranges, pine treeline.
 *  Motion: pure forward zoom (1.0 → 1.9), upward drift −200 px.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ParallaxLayer } from "./ParallaxLayer";

const ZOOM_START = 1.0;
const ZOOM_END   = 1.9;
const DRIFT_X    = 0;
const DRIFT_Y    = -200;

// ── Sub-components ────────────────────────────────────────────

const Background: React.FC = () => (
  <div style={{ position: "absolute", inset: 0,
    background: "linear-gradient(180deg,#060418 0%,#110832 25%,#1e1050 55%,#2e1c64 80%,#3c2878 100%)" }} />
);

const Stars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <svg viewBox="0 0 1920 1080" style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
      {Array.from({ length: 42 }, (_, i) => {
        const cx = ((i * 173.7 + 300) % 1920).toFixed(0);
        const cy = ((i * 97.3  + 50)  % 540).toFixed(0);   // top 50 %
        const r  = 0.8 + (i % 4) * 0.6;
        const base = 0.3 + (i % 6) * 0.1;
        const opacity = Math.max(0.05, Math.min(1,
          base + Math.sin(frame / fps * 1.5 + i * 0.83) * 0.28));
        return <circle key={i} cx={cx} cy={cy} r={r} fill="white" opacity={opacity} />;
      })}
    </svg>
  );
};

const FarMountains: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <polygon
      points="0,1080 0,740 180,560 400,680 620,470 860,610 1080,400 1300,530 1540,460 1760,570 1920,500 1920,1080"
      fill="#1a1a3a" />
  </svg>
);

const MidMountains: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <polygon
      points="0,1080 0,800 160,660 360,740 580,600 800,700 1020,570 1240,650 1460,590 1680,660 1920,620 1920,1080"
      fill="#2a2a5a" />
  </svg>
);

const Treeline: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {Array.from({ length: 20 }, (_, i) => {
      const x   = 40 + (i / 20) * 1840 + ((i * 47) % 60) - 30;
      const h   = 130 + (i % 6) * 28;
      const w   = 32 + (i % 4) * 10;
      const tip = 1080 - h;
      const fill = i % 3 === 0 ? "#0e1824" : i % 3 === 1 ? "#121e2c" : "#0a1418";
      return (
        <polygon key={i}
          points={`${x},${1080} ${x - w/2},${tip} ${x + w/2},${tip}`}
          fill={fill} />
      );
    })}
  </svg>
);

const Boulders: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <polygon points="80,1080  50,940  160,910 220,960 200,1080"  fill="#08081a" />
    <polygon points="340,1080 310,960 430,940 480,980 460,1080"  fill="#0b0b1e" />
    <polygon points="1580,1080 1550,930 1670,910 1730,960 1710,1080" fill="#08081a" />
    <polygon points="1800,1080 1770,950 1880,930 1920,980 1920,1080" fill="#0b0b1e" />
    {/* Grass tufts */}
    {Array.from({ length: 18 }, (_, i) => {
      const x = 60 + i * 104;
      return (
        <g key={i}>
          <line x1={x} y1={1080} x2={x-8}  y2={1040} stroke="#1a2042" strokeWidth={2.5} />
          <line x1={x+5} y1={1080} x2={x+12} y2={1035} stroke="#1a2042" strokeWidth={2.5} />
          <line x1={x+10} y1={1080} x2={x+4} y2={1044} stroke="#141832" strokeWidth={2} />
        </g>
      );
    })}
  </svg>
);

const Foreground: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <rect x={0} y={1010} width={1920} height={70} fill="#060612" />
    <rect x={0} y={1040} width={1920} height={40}  fill="#040410" />
  </svg>
);

// ── Scene 1 ──────────────────────────────────────────────────

interface SceneProps { durationInFrames: number }

export const Scene1: React.FC<SceneProps> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.25, 1, 0.35, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lp = { progress, zoomStart: ZOOM_START, zoomEnd: ZOOM_END, driftX: DRIFT_X, driftY: DRIFT_Y };

  return (
    <AbsoluteFill style={{ backgroundColor: "#060418", overflow: "hidden" }}>
      <div style={{ width:"100%", height:"100%", perspective: 800, perspectiveOrigin: "50% 55%" }}>
        <ParallaxLayer depth={0.0}  {...lp}><Background /></ParallaxLayer>
        <ParallaxLayer depth={0.15} {...lp}><Stars /></ParallaxLayer>
        <ParallaxLayer depth={0.25} {...lp}><FarMountains /></ParallaxLayer>
        <ParallaxLayer depth={0.45} {...lp}><MidMountains /></ParallaxLayer>
        <ParallaxLayer depth={0.65} {...lp}><Treeline /></ParallaxLayer>
        <ParallaxLayer depth={0.85} {...lp}><Boulders /></ParallaxLayer>
        <ParallaxLayer depth={1.0}  {...lp}><Foreground /></ParallaxLayer>
      </div>
      <Audio
        src={staticFile("voiceover/scene1.mp3")}
        volume={(f) =>
          interpolate(f, [0, fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};
