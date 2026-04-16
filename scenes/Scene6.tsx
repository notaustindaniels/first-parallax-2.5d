import React from "react";
import { useVideoConfig } from "remotion";
import {
  FORWARD_EASING,
  ParallaxLayer,
  SceneStage,
  useSceneProgress,
} from "./ParallaxLayer";

const buildWavePath = (
  baseY: number,
  amplitude: number,
  freq: number,
  phase: number,
  time: number,
): string => {
  const pts: string[] = [];
  for (let x = 0; x <= 1920; x += 16) {
    const y = baseY + amplitude * Math.sin(x * freq + phase + time);
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return `M ${pts[0]} L ${pts.slice(1).join(" L ")} L 1920,1080 L 0,1080 Z`;
};

const DISTANT_STACKS =
  "M 200,780 L 240,720 L 280,780 Z M 460,790 L 510,700 L 560,790 Z M 820,785 L 880,710 L 940,785 Z";

const CLIFF_FACE =
  "1200,1080 1180,900 1220,780 1280,680 1360,600 1440,520 1540,460 1640,430 1760,440 1860,480 1920,520 1920,1080";

const CLIFF_LEFT =
  "0,640 80,620 150,660 220,640 290,680 360,660 440,700 500,690 530,760 500,840 540,920 480,980 430,1040 350,1080 0,1080";

export const Scene6: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const { progress, frame } = useSceneProgress(durationInFrames, FORWARD_EASING);
  const { fps } = useVideoConfig();

  const z = { zoomStart: 1.0, zoomEnd: 2.5, driftX: 120, driftY: -250 };
  const t = (frame / fps) * 1.2;

  return (
    <SceneStage background="#1e2028">
      <ParallaxLayer depth={0.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="s6-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a4a58" />
              <stop offset="55%" stopColor="#353642" />
              <stop offset="100%" stopColor="#222430" />
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#s6-sky)" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.2} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <path d={DISTANT_STACKS} fill="#1a1c26" />
          <rect x="0" y="785" width="1920" height="6" fill="#151721" opacity="0.5" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.45} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <polygon points={CLIFF_FACE} fill="#121420" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.55} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <path
            d={buildWavePath(820, 14, 0.008, 0, t * 0.8)}
            fill="#3a4252"
            opacity={0.45}
          />
          <path
            d={buildWavePath(855, 18, 0.006, Math.PI / 3, t)}
            fill="#5a6878"
            opacity={0.35}
          />
          <path
            d={buildWavePath(880, 22, 0.005, (2 * Math.PI) / 3, t * 1.2)}
            fill="#a0b0c0"
            opacity={0.2}
          />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.8} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <polygon points={CLIFF_LEFT} fill="#060810" />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={0.85} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx={540} cy={830} rx={80} ry={22} fill="#ffffff" opacity={0.08} />
          <ellipse cx={620} cy={800} rx={50} ry={16} fill="#ffffff" opacity={0.06} />
          <ellipse cx={460} cy={860} rx={70} ry={20} fill="#ffffff" opacity={0.07} />
          <ellipse cx={680} cy={820} rx={40} ry={14} fill="#ffffff" opacity={0.05} />
          <ellipse cx={400} cy={810} rx={55} ry={18} fill="#ffffff" opacity={0.06} />
          <ellipse cx={760} cy={840} rx={45} ry={15} fill="#ffffff" opacity={0.05} />
          <ellipse cx={340} cy={880} rx={60} ry={18} fill="#ffffff" opacity={0.05} />
          <ellipse cx={500} cy={890} rx={40} ry={12} fill="#ffffff" opacity={0.06} />
        </svg>
      </ParallaxLayer>

      <ParallaxLayer depth={1.0} {...z} progress={progress}>
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="990" width="1920" height="90" fill="#02040a" />
        </svg>
      </ParallaxLayer>
    </SceneStage>
  );
};
