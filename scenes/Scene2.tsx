import React from "react";
import { useVideoConfig } from "remotion";
import {
  FORWARD_EASING,
  ParallaxLayer,
  SceneStage,
  useSceneProgress,
} from "./ParallaxLayer";

const FAR_WALL_LEFT =
  "0,0 500,0 480,200 460,350 420,480 440,600 410,740 430,880 395,1000 420,1080 0,1080";
const FAR_WALL_RIGHT =
  "1420,0 1920,0 1920,1080 1510,1080 1480,990 1500,870 1470,720 1490,580 1460,440 1490,300 1460,180 1420,0";

const NEAR_WALL_LEFT =
  "0,0 600,0 570,180 540,340 490,470 520,620 480,780 510,930 475,1080 0,1080";
const NEAR_WALL_RIGHT =
  "1320,0 1920,0 1920,1080 1445,1080 1410,930 1440,770 1400,610 1430,470 1390,320 1420,170 1380,0";

const BRANCH_D =
  "M 0,940 Q 60,900 130,915 Q 210,920 280,955 Q 340,985 300,1000 Q 250,1015 190,990 Q 130,975 90,1000 Q 40,1015 0,985 Z";

const RIVER_D =
  "M 870,1080 C 920,960 860,830 940,720 C 1010,620 900,500 960,390 C 1020,280 920,160 960,-20";

const GROUND_ROCKS =
  "0,1000 80,975 170,995 260,970 350,995 460,980 560,998 680,985 800,995 920,980 1060,995 1180,985 1300,998 1440,980 1580,995 1700,980 1820,995 1920,985 1920,1080 0,1080";

export const Scene2: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const { progress, frame } = useSceneProgress(durationInFrames, FORWARD_EASING);
  const { fps } = useVideoConfig();

  const z = { zoomStart: 1.0, zoomEnd: 2.5, driftX: -300, driftY: -100 };
  const flowTranslate = ((frame / fps) * 55) % 200;

  return (
    <SceneStage background="#1a1a28">
      <ParallaxLayer depth={0.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="s2-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6a3a4a" />
              <stop offset="55%" stopColor="#4a3040" />
              <stop offset="100%" stopColor="#2a2a3a" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#s2-sky)" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.2} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <polygon points={FAR_WALL_LEFT} fill="#2a2030" />
          <polygon points={FAR_WALL_RIGHT} fill="#2a2030" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.4} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="s2-flow"
              width="200"
              height="80"
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${flowTranslate} 0)`}
            >
              <rect width="200" height="80" fill="#2a4050" />
              <ellipse cx="40" cy="40" rx="36" ry="2.5" fill="#7a9aaa" opacity="0.55" />
              <ellipse cx="140" cy="40" rx="36" ry="2.5" fill="#96b4c2" opacity="0.5" />
              <ellipse cx="90" cy="18" rx="20" ry="1.5" fill="#aac8d4" opacity="0.35" />
              <ellipse cx="170" cy="62" rx="24" ry="1.8" fill="#aac8d4" opacity="0.35" />
            </pattern>
          </defs>
          <path
            d={RIVER_D}
            stroke="url(#s2-flow)"
            strokeWidth="150"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.65} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <polygon points={NEAR_WALL_LEFT} fill="#0f0f1a" />
          <polygon points={NEAR_WALL_RIGHT} fill="#0f0f1a" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.9} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <path d={BRANCH_D} fill="#050510" />
          <ellipse cx="260" cy="930" rx="55" ry="12" fill="#050510" />
          <ellipse cx="80" cy="970" rx="40" ry="10" fill="#050510" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={1.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <polygon points={GROUND_ROCKS} fill="#02020a" />
        </svg>
      </ParallaxLayer>
    </SceneStage>
  );
};
