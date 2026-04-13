import React from "react";
import { Composition } from "remotion";
import { ParallaxZoom } from "./ParallaxZoom";
import { NarratedParallax, calculateMetadata } from "./NarratedParallax";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ParallaxZoom"
        component={ParallaxZoom}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="NarratedParallax"
        component={NarratedParallax}
        durationInFrames={980}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ sceneDurations: Array(8).fill(135) as number[] }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
