import React from "react";
import { useVideoConfig } from "remotion";
import {
  FORWARD_EASING,
  ParallaxLayer,
  SceneStage,
  useSceneProgress,
} from "./ParallaxLayer";

const ROOFTOPS =
  "0,660 60,615 120,640 200,580 280,625 355,595 420,625 500,595 560,630 640,590 720,620 800,580 870,615 950,595 1020,625 1100,590 1170,620 1250,590 1320,625 1400,595 1480,625 1560,590 1640,625 1720,595 1800,620 1880,590 1920,615 1920,1080 0,1080";

const MID_BUILDINGS = [
  { x: 120, y: 430, w: 140, h: 650 },
  { x: 330, y: 400, w: 160, h: 680 },
  { x: 540, y: 450, w: 120, h: 630 },
  { x: 720, y: 380, w: 180, h: 700 },
  { x: 950, y: 420, w: 140, h: 660 },
  { x: 1140, y: 400, w: 160, h: 680 },
  { x: 1340, y: 440, w: 130, h: 640 },
  { x: 1530, y: 390, w: 170, h: 690 },
];

const LANTERN_XS = [120, 280, 440, 600, 760, 920, 1080, 1240, 1400, 1560];

export const Scene3: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const { progress, frame } = useSceneProgress(durationInFrames, FORWARD_EASING);
  const { fps } = useVideoConfig();

  const z = { zoomStart: 1.0, zoomEnd: 2.8, driftY: -400, driftX: 40 };

  return (
    <SceneStage background="#060618">
      <ParallaxLayer depth={0.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="s3-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#050515" />
              <stop offset="100%" stopColor="#0a0a22" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#s3-sky)" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.2} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <polygon points={ROOFTOPS} fill="#0c0c1e" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.4} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          {MID_BUILDINGS.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#0a0a18" />
              {Array.from({ length: Math.floor(b.h / 70) }, (_, row) =>
                Array.from({ length: Math.floor(b.w / 45) }, (_, col) => {
                  const lit = ((row * 7 + col * 3 + i * 11) % 5) < 3;
                  if (!lit) return null;
                  return (
                    <rect
                      key={`${row}-${col}`}
                      x={b.x + 10 + col * 45}
                      y={b.y + 15 + row * 70}
                      width={18}
                      height={28}
                      fill="#ffb070"
                      opacity={0.85}
                    />
                  );
                }),
              )}
            </g>
          ))}
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.55} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="s3-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd090" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#ff9040" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ff6020" stopOpacity="0" />
            </radialGradient>
          </defs>
          <line
            x1="0"
            y1="490"
            x2="1920"
            y2="510"
            stroke="#2a1a10"
            strokeWidth="2"
          />
          {LANTERN_XS.map((lx, i) => {
            const sway = 5 * Math.sin((frame / fps) * 1.2 + i * 0.7);
            const cy = 510 + sway;
            const glow = 0.75 + 0.2 * Math.sin((frame / fps) * 1.8 + i);
            return (
              <g key={i}>
                <line
                  x1={lx}
                  y1={490 + (i * 20) / 10}
                  x2={lx + sway / 3}
                  y2={cy - 22}
                  stroke="#1a0a05"
                  strokeWidth="1.5"
                />
                <circle cx={lx + sway / 3} cy={cy + 40} r="75" fill="url(#s3-halo)" opacity={glow} />
                <circle cx={lx + sway / 3} cy={cy} r="16" fill="#ffcf80" opacity={0.95} />
                <circle cx={lx + sway / 3} cy={cy} r="10" fill="#fff2c0" />
              </g>
            );
          })}
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.75} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="300" height="1080" fill="#040410" />
          <rect x="1620" y="0" width="300" height="1080" fill="#040410" />
          <rect x="60" y="220" width="22" height="34" fill="#ffb070" opacity="0.7" />
          <rect x="60" y="410" width="22" height="34" fill="#ffb070" opacity="0.6" />
          <rect x="140" y="320" width="22" height="34" fill="#ffb070" opacity="0.65" />
          <rect x="1700" y="260" width="22" height="34" fill="#ffb070" opacity="0.7" />
          <rect x="1780" y="380" width="22" height="34" fill="#ffb070" opacity="0.6" />
          <rect x="1700" y="510" width="22" height="34" fill="#ffb070" opacity="0.55" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.9} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 420,560 C 620,360 1300,360 1500,560"
            stroke="#020208"
            strokeWidth="100"
            strokeLinecap="round"
            fill="none"
          />
          <rect x="400" y="540" width="100" height="540" fill="#020208" />
          <rect x="1420" y="540" width="100" height="540" fill="#020208" />
          <rect x="385" y="1040" width="130" height="40" fill="#020208" />
          <rect x="1405" y="1040" width="130" height="40" fill="#020208" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={1.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="960" width="1920" height="120" fill="#01010a" />
          {Array.from({ length: 32 }, (_, i) => (
            <ellipse
              key={i}
              cx={40 + i * 62}
              cy={1000 + (i % 3) * 22}
              rx="22"
              ry="8"
              fill="#0a0a16"
            />
          ))}
        </svg>
      </ParallaxLayer>
    </SceneStage>
  );
};
