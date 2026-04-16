import React from "react";
import { useVideoConfig } from "remotion";
import {
  FORWARD_EASING,
  ParallaxLayer,
  SceneStage,
  useSceneProgress,
} from "./ParallaxLayer";

const STARS = (() => {
  let s = 54321;
  const r = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: 68 }, () => ({
    x: Math.round(r() * 1920),
    y: Math.round(r() * 820),
    radius: 1 + r() * 3,
    phase: r() * Math.PI * 2,
    speed: 0.8 + r() * 2.2,
  }));
})();

const TREELINE_X = Array.from({ length: 22 }, (_, i) => 20 + i * 90);

const HILL_PATH =
  "M 0,900 Q 240,820 480,860 T 960,840 T 1440,860 T 1920,830 L 1920,1080 L 0,1080 Z";
const HILL_PATH_MID =
  "M 0,960 Q 320,890 640,920 T 1280,900 T 1920,910 L 1920,1080 L 0,1080 Z";
const HILL_PATH_NEAR =
  "M 0,1010 Q 400,970 800,990 T 1600,985 T 1920,1000 L 1920,1080 L 0,1080 Z";

export const Scene8: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const { progress, frame } = useSceneProgress(durationInFrames, FORWARD_EASING);
  const { fps } = useVideoConfig();

  const z = { zoomStart: 1.0, zoomEnd: 4.0, driftY: -500 };

  const northPulse = 40 + 10 * Math.sin((frame / fps) * 2);
  const northCore = 0.85 + 0.15 * Math.sin((frame / fps) * 2);

  return (
    <SceneStage background="#010108">
      <ParallaxLayer depth={0.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="s8-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000004" />
              <stop offset="55%" stopColor="#060818" />
              <stop offset="100%" stopColor="#0c0f28" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#s8-sky)" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.1} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          {STARS.map((s, i) => {
            const tw =
              0.3 + 0.7 * (0.5 + 0.5 * Math.sin((frame / fps) * s.speed + s.phase));
            return (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={s.radius}
                fill="#f0f0ff"
                opacity={tw}
              />
            );
          })}
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.2} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="s8-nebula" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#6040a0" stopOpacity="0.3" />
              <stop offset="55%" stopColor="#3060a0" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#000010" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#s8-nebula)" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.3} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="s8-north" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#c0d8ff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3050a0" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={960} cy={420} r={northPulse} fill="url(#s8-north)" />
          <circle cx={960} cy={420} r={5.5} fill="#ffffff" opacity={northCore} />
          <line
            x1={960}
            y1={420 - 18}
            x2={960}
            y2={420 + 18}
            stroke="#ffffff"
            strokeWidth="1.2"
            opacity={northCore * 0.55}
          />
          <line
            x1={960 - 18}
            y1={420}
            x2={960 + 18}
            y2={420}
            stroke="#ffffff"
            strokeWidth="1.2"
            opacity={northCore * 0.55}
          />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.6} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <path d={HILL_PATH} fill="#050712" />
          <path d={HILL_PATH_MID} fill="#030510" opacity={0.9} />
          <path d={HILL_PATH_NEAR} fill="#02040c" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.85} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          {TREELINE_X.map((tx, i) => {
            const h = 60 + ((i * 37) % 40);
            return (
              <polygon
                key={i}
                points={`${tx - 18},1080 ${tx + 18},1080 ${tx},${1080 - h}`}
                fill="#010208"
              />
            );
          })}
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={1.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="1000" width="1920" height="80" fill="#000002" />
        </svg>
      </ParallaxLayer>
    </SceneStage>
  );
};
