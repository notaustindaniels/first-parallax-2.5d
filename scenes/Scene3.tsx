/** Scene 3 — LANTERN ALLEY
 *  Deep navy-to-black city night. Amber lantern glow, lit windows, arch framing.
 *  Motion: dramatic upward zoom (1.0 → 2.0), upward drift −250 px, mild rightward drift.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ParallaxLayer } from "./ParallaxLayer";

const ZOOM_START = 1.0;
const ZOOM_END   = 2.0;
const DRIFT_X    = 60;
const DRIFT_Y    = -250;

// ── Sub-components ────────────────────────────────────────────

const Background: React.FC = () => (
  <div style={{ position:"absolute", inset:0,
    background: "linear-gradient(180deg,#040418 0%,#07082a 40%,#04040e 100%)" }} />
);

const FarRooftops: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {[
      [0,   420, 240, 400], [240, 380, 200, 380], [440, 350, 280, 380],
      [720, 390, 220, 380], [940, 360, 260, 380], [1200,400, 200, 380],
      [1400,370, 240, 380], [1640,390, 280, 380],
    ].map(([x, topY, w], i) => (
      <g key={i}>
        {/* Building body */}
        <rect x={x} y={topY + 40} width={w} height={1080 - topY - 40} fill="#0c0c28" />
        {/* Triangle roof */}
        <polygon points={`${x},${topY + 40} ${x + w! / 2},${topY} ${x + w!},${topY + 40}`}
          fill="#0e0e30" />
      </g>
    ))}
  </svg>
);

const MidBuildings: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {[
      { x: 60,  top: 300, w: 280 },
      { x: 380, top: 260, w: 320 },
      { x: 740, top: 240, w: 300 },
      { x: 1100,top: 270, w: 280 },
      { x: 1420,top: 290, w: 340 },
      { x: 1760,top: 280, w: 160 },
    ].map(({ x, top, w }, i) => (
      <g key={i}>
        <rect x={x} y={top} width={w} height={1080 - top} fill="#100c22" />
        <polygon points={`${x},${top} ${x+w/2},${top - 40} ${x+w},${top}`} fill="#12102a" />
        {/* Amber-lit windows */}
        {Array.from({ length: 12 }, (_, j) => {
          const col = j % 3;
          const row = Math.floor(j / 3);
          const wx = x + 20 + col * (w - 40) / 2;
          const wy = top + 30 + row * 55;
          return <rect key={j} x={wx} y={wy} width={28} height={16}
            fill="#e8a030" opacity={0.55 + (j % 3) * 0.15} rx={2} />;
        })}
      </g>
    ))}
  </svg>
);

const Lanterns: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Gentle sway
  const sway = Math.sin(frame / fps * 0.9) * 4;
  return (
    <svg viewBox="0 0 1920 1080"
      style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
      <defs>
        {Array.from({ length: 9 }, (_, i) => (
          <radialGradient key={i} id={`lg${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#f0a020" stopOpacity={0.8} />
            <stop offset="60%"  stopColor="#e07010" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#c04800" stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
      {Array.from({ length: 9 }, (_, i) => {
        const cx = 160 + i * 200 + sway * (i % 2 === 0 ? 1 : -1);
        const cy = 480 + Math.sin(i * 1.3) * 40;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={50} fill={`url(#lg${i})`} />
            <circle cx={cx} cy={cy} r={14} fill="#f8c040" />
            <line x1={cx} y1={cy - 14} x2={cx} y2={cy - 40} stroke="#c88020" strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
};

const NearBuildings: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <rect x={0}    y={100} width={200} height={980} fill="#06060e" />
    <rect x={1720} y={80}  width={200} height={1000} fill="#06060e" />
    <rect x={0}    y={100} width={200} height={980} fill="#070710" />
  </svg>
);

const Arch: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {/* Left side arch pillar */}
    <rect x={0} y={0} width={120} height={1080} fill="#04040c" />
    {/* Arch top-left curve (approximated as polygon) */}
    <polygon points="0,0 340,0 340,80 120,80 120,400 0,400" fill="#04040c" />
    {/* Bottom ground bar */}
    <rect x={0} y={980} width={600} height={100} fill="#030308" />
    <rect x={0} y={1020} width={1920} height={60} fill="#02020a" />
  </svg>
);

// ── Scene 3 ──────────────────────────────────────────────────

interface SceneProps { durationInFrames: number }

export const Scene3: React.FC<SceneProps> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.25, 1, 0.35, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lp = { progress, zoomStart: ZOOM_START, zoomEnd: ZOOM_END, driftX: DRIFT_X, driftY: DRIFT_Y };

  return (
    <AbsoluteFill style={{ backgroundColor: "#030310", overflow: "hidden" }}>
      <div style={{ width:"100%", height:"100%", perspective: 800, perspectiveOrigin: "50% 55%" }}>
        <ParallaxLayer depth={0.0}  {...lp}><Background /></ParallaxLayer>
        <ParallaxLayer depth={0.2}  {...lp}><FarRooftops /></ParallaxLayer>
        <ParallaxLayer depth={0.4}  {...lp}><MidBuildings /></ParallaxLayer>
        <ParallaxLayer depth={0.55} {...lp}><Lanterns /></ParallaxLayer>
        <ParallaxLayer depth={0.7}  {...lp}><NearBuildings /></ParallaxLayer>
        <ParallaxLayer depth={0.85} {...lp}><Arch /></ParallaxLayer>
        <ParallaxLayer depth={1.0}  {...lp}>
          <div style={{ position:"absolute",bottom:0,left:0,right:0,height:60,background:"#02020a" }} />
        </ParallaxLayer>
      </div>
      <Audio src={staticFile("voiceover/scene3.mp3")} />
    </AbsoluteFill>
  );
};
