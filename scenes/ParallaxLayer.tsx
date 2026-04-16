import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";

export const FORWARD_EASING = Easing.bezier(0.7, 0, 0.95, 1);
export const REVERSE_EASING = Easing.bezier(0.05, 0.6, 0.3, 1);

export const SceneStage: React.FC<{
  children: React.ReactNode;
  background?: string;
}> = ({ children, background }) => (
  <AbsoluteFill
    style={{
      perspective: "600px",
      perspectiveOrigin: "50% 50%",
      transformStyle: "preserve-3d",
      background: background ?? "#000",
      overflow: "hidden",
    }}
  >
    {children}
  </AbsoluteFill>
);

export type ParallaxLayerProps = {
  children: React.ReactNode;
  depth: number;
  zoomStart: number;
  zoomEnd: number;
  driftX?: number;
  driftY?: number;
  progress: number;
};

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  depth,
  zoomStart,
  zoomEnd,
  driftX = 0,
  driftY = 0,
  progress,
}) => {
  const depthMultiplier = 1 + depth * 8;
  const baseZoom = zoomStart + (zoomEnd - zoomStart) * progress;
  const layerScale = 1 + (baseZoom - 1) * depthMultiplier;
  const translateX = driftX * depthMultiplier * progress;
  const translateY = driftY * depthMultiplier * progress;
  const translateZ = depth * 120;

  return (
    <AbsoluteFill
      style={{
        transformOrigin: "50% 50%",
        transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) scale(${layerScale})`,
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const useSceneProgress = (
  durationInFrames: number,
  easing: (value: number) => number = FORWARD_EASING,
): { frame: number; progress: number } => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
  return { frame, progress };
};
