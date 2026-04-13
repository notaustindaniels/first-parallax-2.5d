import React from "react";
import { AbsoluteFill } from "remotion";

export interface ParallaxLayerProps {
  depth: number;
  progress: number;
  zoomStart: number;
  zoomEnd: number;
  driftX: number;
  driftY: number;
  children: React.ReactNode;
  /** Extra Y offset added on top of parallax — used for heat distortion etc. */
  extraY?: number;
}

/**
 * A single depth-aware layer inside a 2.5D parallax scene.
 *
 * Formula (per spec):
 *   depthMultiplier = 1 + depth * 2.5
 *   baseZoom        = zoomStart + (zoomEnd - zoomStart) * progress
 *   layerScale      = 1 + (baseZoom - 1) * depthMultiplier
 *   translateX      = driftX * depthMultiplier * progress
 *   translateY      = driftY * depthMultiplier * progress
 *   translateZ      = depth * 80px
 *
 * Parent container must have: perspective: 800px, perspectiveOrigin: "50% 55%"
 */
export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  depth,
  progress,
  zoomStart,
  zoomEnd,
  driftX,
  driftY,
  children,
  extraY = 0,
}) => {
  const depthMultiplier = 1 + depth * 2.5;
  const baseZoom = zoomStart + (zoomEnd - zoomStart) * progress;
  const layerScale = 1 + (baseZoom - 1) * depthMultiplier;
  const translateX = driftX * depthMultiplier * progress;
  const translateY = driftY * depthMultiplier * progress + extraY;
  const translateZ = depth * 80;

  return (
    <AbsoluteFill
      style={{
        transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) scale(${layerScale})`,
        transformOrigin: "50% 55%",
        willChange: "transform",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
