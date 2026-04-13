/** Scene 4 — CITY SKYLINE (REVERSE ZOOM — pull out)
 *  Steel-blue palette. Starts zoomed in on glass towers, pulls back to reveal the skyline.
 *  Motion: REVERSE zoom (1.3 → 1.0), downward drift +150 px (crane tilts down as it pulls back).
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { ParallaxLayer } from "./ParallaxLayer";

// NOTE: zoomStart > zoomEnd → pull-out
const ZOOM_START = 1.3;
const ZOOM_END   = 1.0;
const DRIFT_X    = 0;
const DRIFT_Y    = 150;   // drift DOWN → reveals ground as we pull back

// ── Sub-components ────────────────────────────────────────────

const Background: React.FC = () => (
  <div style={{ position:"absolute", inset:0,
    background: "linear-gradient(180deg,#1a2a4a 0%,#253a5a 35%,#3a4a6a 65%,#1a2030 100%)" }} />
);

const FarBuildings: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {Array.from({ length: 24 }, (_, i) => {
      const x = i * 80;
      const h = 100 + (i % 7) * 35;
      return <rect key={i} x={x} y={1080 - h} width={70} height={h} fill="#243050" />;
    })}
  </svg>
);

const Skyscrapers: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {[
      { x: 80,  w: 130, h: 580 },
      { x: 260, w: 110, h: 700 },
      { x: 420, w: 150, h: 520 },
      { x: 640, w: 120, h: 650 },
      { x: 830, w: 140, h: 780 },
      { x:1060, w: 100, h: 600 },
      { x:1230, w: 130, h: 540 },
      { x:1440, w: 110, h: 680 },
      { x:1640, w: 140, h: 610 },
    ].map(({ x, w, h }, i) => (
      <g key={i}>
        <rect x={x} y={1080-h} width={w} height={h} fill="#1e2c3e" />
        {/* Window grid */}
        {Array.from({ length: 40 }, (_, j) => {
          const col = j % 4;
          const row = Math.floor(j / 4);
          const wx = x + 8 + col * (w / 4 - 2);
          const wy = 1080 - h + 12 + row * 24;
          const lit = (i + j) % 5 !== 0;
          return <rect key={j} x={wx} y={wy} width={w/4 - 8} height={14}
            fill={lit ? "#4a6888" : "#2a3a50"} opacity={lit ? 0.7 : 0.3} />;
        })}
      </g>
    ))}
  </svg>
);

const MassiveBuilding: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {/* Massive building fills right 30% */}
    <rect x={1340} y={0} width={580} height={1080} fill="#182030" />
    {/* Window grid */}
    {Array.from({ length: 90 }, (_, i) => {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const lit = (i * 7) % 11 > 3;
      return <rect key={i} x={1360 + col * 82} y={20 + row * 58} width={60} height={38}
        fill={lit ? "#3a5878" : "#202840"} opacity={lit ? 0.6 : 0.25} />;
    })}
    {/* Edge highlight */}
    <rect x={1340} y={0} width={8} height={1080} fill="#2a3848" />
  </svg>
);

const Railing: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    {/* Horizontal railing bars */}
    <rect x={0} y={870} width={1340} height={6}  fill="#3a4a5a" />
    <rect x={0} y={890} width={1340} height={4}  fill="#2a3848" />
    <rect x={0} y={920} width={1340} height={6}  fill="#3a4a5a" />
    {/* Vertical posts */}
    {Array.from({ length: 18 }, (_, i) => (
      <rect key={i} x={i * 74} y={860} width={4} height={70} fill="#304050" />
    ))}
    <rect x={0} y={950} width={1340} height={130} fill="#141c28" />
  </svg>
);

const Foreground: React.FC = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none"
    style={{ position:"absolute",inset:0,width:"100%",height:"100%" }}>
    <rect x={0} y={990} width={1920} height={90} fill="#0e1620" />
    <rect x={0} y={1040} width={1920} height={40} fill="#0a1018" />
  </svg>
);

// ── Scene 4 ──────────────────────────────────────────────────

interface SceneProps { durationInFrames: number }

export const Scene4: React.FC<SceneProps> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.25, 1, 0.35, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lp = { progress, zoomStart: ZOOM_START, zoomEnd: ZOOM_END, driftX: DRIFT_X, driftY: DRIFT_Y };

  return (
    <AbsoluteFill style={{ backgroundColor: "#141c28", overflow: "hidden" }}>
      <div style={{ width:"100%", height:"100%", perspective: 800, perspectiveOrigin: "50% 55%" }}>
        <ParallaxLayer depth={0.0}  {...lp}><Background /></ParallaxLayer>
        <ParallaxLayer depth={0.15} {...lp}><FarBuildings /></ParallaxLayer>
        <ParallaxLayer depth={0.35} {...lp}><Skyscrapers /></ParallaxLayer>
        <ParallaxLayer depth={0.6}  {...lp}><MassiveBuilding /></ParallaxLayer>
        <ParallaxLayer depth={0.85} {...lp}><Railing /></ParallaxLayer>
        <ParallaxLayer depth={1.0}  {...lp}><Foreground /></ParallaxLayer>
      </div>
      <Audio src={staticFile("voiceover/scene4.mp3")} />
    </AbsoluteFill>
  );
};
