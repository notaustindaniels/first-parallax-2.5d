import React from "react";
import { useVideoConfig } from "remotion";
import {
  FORWARD_EASING,
  ParallaxLayer,
  SceneStage,
  useSceneProgress,
} from "./ParallaxLayer";

const makeRng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const STARS = (() => {
  const r = makeRng(12345);
  return Array.from({ length: 55 }, () => ({
    x: Math.round(r() * 1920),
    y: Math.round(r() * 620),
    radius: 0.8 + r() * 2.2,
    phase: r() * Math.PI * 2,
    speed: 0.9 + r() * 1.8,
  }));
})();

const FAR_MOUNTAINS =
  "0,560 80,500 160,540 240,470 320,510 400,455 480,520 560,470 640,505 720,445 800,500 880,460 960,510 1040,440 1120,495 1200,460 1280,500 1360,455 1440,525 1520,470 1600,500 1680,440 1760,495 1840,465 1920,505 1920,1080 0,1080";

const MID_MOUNTAINS =
  "0,620 120,525 240,585 360,480 480,555 600,500 720,570 840,475 960,540 1080,505 1200,570 1320,475 1440,550 1560,495 1680,560 1800,495 1920,545 1920,1080 0,1080";

const PINE_LEFT = [
  { x: 30, top: 560, halfW: 45 },
  { x: 95, top: 490, halfW: 55 },
  { x: 155, top: 530, halfW: 48 },
  { x: 200, top: 470, halfW: 60 },
  { x: 245, top: 545, halfW: 42 },
];
const PINE_RIGHT = [
  { x: 1680, top: 560, halfW: 45 },
  { x: 1740, top: 480, halfW: 55 },
  { x: 1800, top: 530, halfW: 48 },
  { x: 1855, top: 495, halfW: 60 },
  { x: 1905, top: 555, halfW: 42 },
];

const pinePts = (p: { x: number; top: number; halfW: number }) =>
  `${p.x - p.halfW},1080 ${p.x + p.halfW},1080 ${p.x},${p.top}`;

export const Scene1: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const { progress, frame } = useSceneProgress(durationInFrames, FORWARD_EASING);
  const { fps } = useVideoConfig();

  const z = { zoomStart: 1.0, zoomEnd: 3.0, driftY: -300 };

  return (
    <SceneStage background="#050515">
      <ParallaxLayer depth={0.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="s1-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#090925" />
              <stop offset="55%" stopColor="#1a0a3a" />
              <stop offset="100%" stopColor="#2a1a5a" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#s1-sky)" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.1} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          {STARS.map((s, i) => {
            const tw =
              0.35 +
              0.65 * (0.5 + 0.5 * Math.sin((frame / fps) * s.speed + s.phase));
            return (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={s.radius}
                fill="#ffffff"
                opacity={tw}
              />
            );
          })}
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.25} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <polygon points={FAR_MOUNTAINS} fill="#1a1a3a" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.5} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <polygon points={MID_MOUNTAINS} fill="#181830" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.7} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          {PINE_LEFT.map((p, i) => (
            <polygon key={`pl${i}`} points={pinePts(p)} fill="#070714" />
          ))}
          {PINE_RIGHT.map((p, i) => (
            <polygon key={`pr${i}`} points={pinePts(p)} fill="#070714" />
          ))}
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.9} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <polygon
            points="0,990 40,900 120,875 190,915 225,975 210,1080 0,1080"
            fill="#03030a"
          />
          <polygon
            points="1715,995 1760,905 1830,880 1895,930 1920,990 1920,1080 1715,1080"
            fill="#03030a"
          />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={1.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="980" width="1920" height="100" fill="#01010a" />
        </svg>
      </ParallaxLayer>
    </SceneStage>
  );
};
