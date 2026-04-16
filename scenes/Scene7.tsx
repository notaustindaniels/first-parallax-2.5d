import React from "react";
import { useVideoConfig } from "remotion";
import {
  FORWARD_EASING,
  ParallaxLayer,
  SceneStage,
  useSceneProgress,
} from "./ParallaxLayer";

const CRACKED_CELLS = (() => {
  let s = 2222;
  const r = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const cells: { points: string }[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 16; col++) {
      const cx = 60 + col * 125 + r() * 18;
      const cy = 880 + row * 42 + r() * 10;
      const w = 56 + r() * 18;
      const h = 22 + r() * 8;
      cells.push({
        points: `${cx - w / 2},${cy - h / 2} ${cx + w / 2},${cy - h / 2 + r() * 6} ${cx + w / 2 + r() * 8},${cy + h / 2} ${cx - w / 2 + r() * 6},${cy + h / 2 + r() * 4}`,
      });
    }
  }
  return cells;
})();

export const Scene7: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const { progress, frame } = useSceneProgress(durationInFrames, FORWARD_EASING);
  const { fps } = useVideoConfig();

  const z = { zoomStart: 1.0, zoomEnd: 2.2, driftX: -350, driftY: -50 };

  const shimmerOpacity = 0.1 + 0.05 * Math.sin((frame / fps) * 3);
  const heatY = Math.sin((frame / fps) * 1.8) * 4;

  return (
    <SceneStage background="#d87a40">
      <ParallaxLayer depth={0.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="s7-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd890" />
              <stop offset="45%" stopColor="#ff9848" />
              <stop offset="100%" stopColor="#d85828" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#s7-sky)" />
          <circle cx="1280" cy="420" r="140" fill="#fff2c8" opacity="0.35" />
          <circle cx="1280" cy="420" r="80" fill="#fffad8" opacity="0.55" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.15} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <rect
            x="0"
            y="600"
            width="1920"
            height="80"
            fill="#ffe8b0"
            opacity={shimmerOpacity}
          />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.3} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 0,720 Q 240,660 480,700 T 960,680 T 1440,700 T 1920,680 L 1920,1080 L 0,1080 Z"
            fill="#c86030"
          />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.55} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <path
            d={`M 0,${800 + heatY} Q 320,${720 + heatY} 640,${780 + heatY} T 1280,${760 + heatY} T 1920,${790 + heatY} L 1920,1080 L 0,1080 Z`}
            fill="#a04020"
          />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.8} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 900,1080 Q 1100,780 1320,720 Q 1540,680 1720,740 Q 1860,800 1920,900 L 1920,1080 Z"
            fill="#6a2818"
          />
          <path
            d="M 900,1080 Q 1100,780 1320,720"
            stroke="#4a1a0e"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.9} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          {CRACKED_CELLS.map((c, i) => (
            <polygon
              key={i}
              points={c.points}
              fill="#4a1a0c"
              stroke="#2a0e05"
              strokeWidth="1.2"
            />
          ))}
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={1.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="1010" width="1920" height="70" fill="#1a0608" />
        </svg>
      </ParallaxLayer>
    </SceneStage>
  );
};
