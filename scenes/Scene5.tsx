import React from "react";
import { useVideoConfig } from "remotion";
import {
  FORWARD_EASING,
  ParallaxLayer,
  SceneStage,
  useSceneProgress,
} from "./ParallaxLayer";

const CANOPY = [
  { cx: 120, cy: 180, rx: 220, ry: 140 },
  { cx: 380, cy: 140, rx: 260, ry: 160 },
  { cx: 640, cy: 200, rx: 240, ry: 150 },
  { cx: 900, cy: 150, rx: 280, ry: 170 },
  { cx: 1160, cy: 210, rx: 260, ry: 160 },
  { cx: 1420, cy: 170, rx: 240, ry: 150 },
  { cx: 1680, cy: 200, rx: 260, ry: 170 },
  { cx: 1900, cy: 140, rx: 220, ry: 140 },
];

const TRUNK_X = [80, 290, 500, 720, 960, 1190, 1410, 1620, 1840];

const FIREFLIES = (() => {
  let s = 7777;
  const r = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: 26 }, () => ({
    x: r() * 1920,
    y: 260 + r() * 620,
    phase: r() * Math.PI * 2,
    speed: 1.4 + r() * 1.3,
  }));
})();

const MUSHROOMS = [
  { x: 180, y: 920 },
  { x: 340, y: 940 },
  { x: 540, y: 930 },
  { x: 780, y: 950 },
  { x: 1080, y: 935 },
  { x: 1300, y: 945 },
  { x: 1520, y: 925 },
  { x: 1720, y: 945 },
];

const LEAF_D =
  "M 1920,1080 C 1700,1060 1420,1000 1240,880 C 1080,780 980,620 1100,520 C 1200,440 1380,460 1520,540 C 1680,640 1820,780 1900,900 C 1920,960 1920,1020 1920,1080 Z";

export const Scene5: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const { progress, frame } = useSceneProgress(durationInFrames, FORWARD_EASING);
  const { fps } = useVideoConfig();

  const z = { zoomStart: 1.0, zoomEnd: 2.8, driftX: -150, driftY: -200 };

  return (
    <SceneStage background="#030805">
      <ParallaxLayer depth={0.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="s5-sky" cx="50%" cy="40%" r="80%">
              <stop offset="0%" stopColor="#0a1810" />
              <stop offset="100%" stopColor="#020505" />
            </radialGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#s5-sky)" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.2} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          {CANOPY.map((c, i) => (
            <ellipse
              key={i}
              cx={c.cx}
              cy={c.cy}
              rx={c.rx}
              ry={c.ry}
              fill="#0a1810"
              opacity={0.95}
            />
          ))}
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.5} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          {TRUNK_X.map((tx, i) => (
            <rect
              key={i}
              x={tx - 25}
              y={-20}
              width={50}
              height={1100}
              fill="#050805"
            />
          ))}
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.65} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          {MUSHROOMS.map((m, i) => (
            <g key={i}>
              <rect x={m.x - 4} y={m.y} width={8} height={22} fill="#1a120a" />
              <ellipse cx={m.x} cy={m.y - 2} rx={18} ry={10} fill="#6a2a1a" />
              <ellipse cx={m.x - 6} cy={m.y - 6} rx={3} ry={2} fill="#f0d0a0" opacity={0.6} />
              <ellipse cx={m.x + 4} cy={m.y - 4} rx={2} ry={1.5} fill="#f0d0a0" opacity={0.5} />
            </g>
          ))}
          <path
            d="M 0,1000 Q 120,960 240,990 T 480,985 T 720,995 T 960,985 T 1200,990 T 1440,985 T 1680,995 T 1920,985 L 1920,1080 L 0,1080 Z"
            fill="#060c08"
          />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.75} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="s5-fly" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e8ffa0" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#a0c050" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#405030" stopOpacity="0" />
            </radialGradient>
          </defs>
          {FIREFLIES.map((f, i) => {
            const pulse =
              0.25 + 0.75 * (0.5 + 0.5 * Math.sin((frame / fps) * f.speed + f.phase));
            return (
              <g key={i}>
                <circle cx={f.x} cy={f.y} r={18} fill="url(#s5-fly)" opacity={pulse} />
                <circle cx={f.x} cy={f.y} r={2.5} fill="#fcffd0" opacity={pulse} />
              </g>
            );
          })}
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.9} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <path d={LEAF_D} fill="#040a06" />
          <path
            d="M 1920,1080 C 1780,1020 1620,940 1500,820 C 1380,700 1280,580 1260,500"
            stroke="#0a1208"
            strokeWidth="4"
            fill="none"
          />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={1.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="970" width="1920" height="110" fill="#020604" />
        </svg>
      </ParallaxLayer>
    </SceneStage>
  );
};
