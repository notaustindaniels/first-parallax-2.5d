import React from "react";
import {
  ParallaxLayer,
  REVERSE_EASING,
  SceneStage,
  useSceneProgress,
} from "./ParallaxLayer";

const FAR_BUILDINGS = [
  { x: 60, y: 620, w: 90, h: 460 },
  { x: 170, y: 640, w: 70, h: 440 },
  { x: 260, y: 600, w: 80, h: 480 },
  { x: 360, y: 630, w: 95, h: 450 },
  { x: 480, y: 615, w: 75, h: 465 },
  { x: 580, y: 640, w: 85, h: 440 },
  { x: 690, y: 620, w: 70, h: 460 },
  { x: 780, y: 605, w: 90, h: 475 },
  { x: 900, y: 625, w: 80, h: 455 },
  { x: 1000, y: 615, w: 85, h: 465 },
  { x: 1110, y: 640, w: 75, h: 440 },
  { x: 1210, y: 625, w: 90, h: 455 },
  { x: 1320, y: 615, w: 80, h: 465 },
  { x: 1420, y: 635, w: 85, h: 445 },
  { x: 1530, y: 620, w: 75, h: 460 },
  { x: 1630, y: 625, w: 90, h: 455 },
  { x: 1740, y: 615, w: 80, h: 465 },
  { x: 1830, y: 640, w: 70, h: 440 },
];

const SKYSCRAPERS = [
  { x: 100, y: 340, w: 140, h: 740 },
  { x: 280, y: 260, w: 170, h: 820 },
  { x: 490, y: 380, w: 120, h: 700 },
  { x: 650, y: 300, w: 180, h: 780 },
  { x: 870, y: 220, w: 210, h: 860 },
  { x: 1120, y: 320, w: 150, h: 760 },
  { x: 1310, y: 280, w: 190, h: 800 },
  { x: 1540, y: 360, w: 130, h: 720 },
  { x: 1710, y: 310, w: 170, h: 770 },
];

const windowGrid = (b: { x: number; y: number; w: number; h: number }, idx: number) => {
  const rows = Math.floor(b.h / 45);
  const cols = Math.floor(b.w / 32);
  const out: React.ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = ((r * 5 + c * 3 + idx * 7) % 6) < 4;
      if (!lit) continue;
      out.push(
        <rect
          key={`${r}-${c}`}
          x={b.x + 8 + c * 32}
          y={b.y + 12 + r * 45}
          width={14}
          height={22}
          fill="#ffc088"
          opacity={0.8}
        />,
      );
    }
  }
  return out;
};

export const Scene4: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const { progress } = useSceneProgress(durationInFrames, REVERSE_EASING);
  const z = { zoomStart: 2.0, zoomEnd: 1.0, driftY: 200 };

  return (
    <SceneStage background="#151822">
      <ParallaxLayer depth={0.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="s4-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#253545" />
              <stop offset="60%" stopColor="#1a2230" />
              <stop offset="100%" stopColor="#12171f" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#s4-sky)" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.15} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          {FAR_BUILDINGS.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill="#0e131c" />
          ))}
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.35} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          {SKYSCRAPERS.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#070a12" />
              {windowGrid(b, i)}
            </g>
          ))}
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.55} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <rect x="280" y="180" width="1360" height="680" fill="#3a5060" opacity="0.28" />
          <line x1="280" y1="400" x2="1640" y2="400" stroke="#a0c0d0" strokeWidth="1" opacity="0.12" />
          <line x1="280" y1="620" x2="1640" y2="620" stroke="#a0c0d0" strokeWidth="1" opacity="0.12" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.75} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 200 100 L 1720 100 L 1720 980 L 200 980 Z M 280 180 L 1640 180 L 1640 860 L 280 860 Z"
            fill="#181c24"
            fillRule="evenodd"
          />
          <rect x="280" y="180" width="1360" height="6" fill="#2a3040" />
          <rect x="280" y="854" width="1360" height="6" fill="#2a3040" />
          <rect x="280" y="180" width="6" height="680" fill="#2a3040" />
          <rect x="1634" y="180" width="6" height="680" fill="#2a3040" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.9} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <rect x="340" y="970" width="1240" height="8" fill="#0a0e16" />
          <rect x="340" y="978" width="1240" height="30" fill="#14181f" />
          {Array.from({ length: 18 }, (_, i) => (
            <rect
              key={i}
              x={360 + i * 70}
              y={910}
              width={4}
              height={68}
              fill="#0a0e16"
            />
          ))}
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={1.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="1008" width="1920" height="72" fill="#05080c" />
        </svg>
      </ParallaxLayer>
    </SceneStage>
  );
};
