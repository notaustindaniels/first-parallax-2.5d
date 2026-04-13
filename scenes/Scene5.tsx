/** Scene 5 — FOREST FLOOR
 *  Dark green-to-black. Canopy layers, tree trunks, fireflies, giant leaf foreground.
 *  Motion: diagonal push (driftY −120, driftX −100).
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ParallaxLayer } from "./ParallaxLayer";

const ZOOM_START = 1.0;
const ZOOM_END   = 1.7;
const DRIFT_X    = -100;
const DRIFT_Y    = -120;

// ── Sub-components ────────────────────────────────────────────

const Background: React.FC = () => (
  <div style={{ position:"absolute", inset:0,
    background: "linear-gradient(180deg,#030a04 0%,#04100a 40%,#030808 75%,#020604 100%)" }} />
);

const Canopy: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {Array.from({ length: 18 }, (_, i) => {
      const cx = (i / 18) * 2100 - 90;
      const cy = 80 + (i % 5) * 60;
      const rx = 200 + (i % 4) * 60;
      const ry = 120 + (i % 3) * 40;
      const fill = i % 3 === 0 ? "#081808" : i % 3 === 1 ? "#0a1e0c" : "#061206";
      return <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} />;
    })}
  </svg>
);

const TreeTrunks: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {Array.from({ length: 12 }, (_, i) => {
      const x = 60 + (i / 12) * 1800;
      const w = 22 + (i % 4) * 8;
      const fill = i % 2 === 0 ? "#1a120a" : "#141008";
      return <rect key={i} x={x - w/2} y={180} width={w} height={900} fill={fill} />;
    })}
  </svg>
);

const GroundPlants: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {/* Mushrooms */}
    {[200, 520, 840, 1160, 1480, 1760].map((x, i) => (
      <g key={i}>
        <ellipse cx={x} cy={940} rx={25} ry={12} fill="#3a2820" />
        <rect x={x-5} y={910} width={10} height={35} fill="#2a1e16" />
        <ellipse cx={x} cy={910} rx={28} ry={18} fill="#c04820" opacity={0.8} />
      </g>
    ))}
    {/* Fern fronds (simplified) */}
    {Array.from({ length: 8 }, (_, i) => {
      const bx = 100 + i * 230;
      return (
        <g key={i}>
          <path d={`M${bx},1080 Q${bx-30},${980} ${bx-50},${940}`}
            stroke="#0e2010" strokeWidth={8} fill="none" />
          <path d={`M${bx},1080 Q${bx+30},${970} ${bx+60},${930}`}
            stroke="#0e2010" strokeWidth={6} fill="none" />
        </g>
      );
    })}
  </svg>
);

const Fireflies: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <svg viewBox="0 0 1920 1080"
      style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
      {Array.from({ length: 22 }, (_, i) => {
        const cx = ((i * 173 + 200) % 1600) + 160;
        const cy = 400 + (i % 8) * 70;
        const opacity = Math.max(0, Math.sin(frame / fps * 1.2 + i * 0.97)) * 0.9;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={6}  fill="#80ff80" opacity={opacity * 0.4} />
            <circle cx={cx} cy={cy} r={2.5} fill="#c0ffc0" opacity={opacity} />
          </g>
        );
      })}
    </svg>
  );
};

const LeafForeground: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {/* Large leaf from bottom-right */}
    <path
      d="M1920,1080 Q1700,900 1500,800 Q1600,700 1700,650 Q1800,650 1900,700 Q1950,750 1920,800 Q1980,820 1920,1080"
      fill="#061008" />
    <path
      d="M1920,1080 Q1750,950 1600,860 Q1680,780 1780,740"
      stroke="#081410" strokeWidth={6} fill="none" />
    <rect x={0} y={1020} width={1920} height={60} fill="#020604" />
  </svg>
);

// ── Scene 5 ──────────────────────────────────────────────────

interface SceneProps { durationInFrames: number }

export const Scene5: React.FC<SceneProps> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.25, 1, 0.35, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lp = { progress, zoomStart: ZOOM_START, zoomEnd: ZOOM_END, driftX: DRIFT_X, driftY: DRIFT_Y };

  return (
    <AbsoluteFill style={{ backgroundColor: "#020604", overflow: "hidden" }}>
      <div style={{ width:"100%", height:"100%", perspective: 800, perspectiveOrigin: "50% 55%" }}>
        <ParallaxLayer depth={0.0}  {...lp}><Background /></ParallaxLayer>
        <ParallaxLayer depth={0.2}  {...lp}><Canopy /></ParallaxLayer>
        <ParallaxLayer depth={0.4}  {...lp}><TreeTrunks /></ParallaxLayer>
        <ParallaxLayer depth={0.55} {...lp}><GroundPlants /></ParallaxLayer>
        <ParallaxLayer depth={0.7}  {...lp}><Fireflies /></ParallaxLayer>
        <ParallaxLayer depth={0.85} {...lp}><LeafForeground /></ParallaxLayer>
        <ParallaxLayer depth={1.0}  {...lp}>
          <div style={{ position:"absolute",bottom:0,left:0,right:0,height:55,background:"#020604" }} />
        </ParallaxLayer>
      </div>
      <Audio src={staticFile("voiceover/scene5.mp3")} />
    </AbsoluteFill>
  );
};
