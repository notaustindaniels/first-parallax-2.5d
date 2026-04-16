import React from "react";
import { Composition } from "remotion";
import {
  NarratedParallax,
  SceneDebug,
  calculateMetadata,
} from "./NarratedParallax";
import { SceneFPVForest } from "./scenes/SceneFPVForest";
import { SceneFPVCityNight } from "./scenes/SceneFPVCityNight";
import { SceneFPVForestToCity } from "./scenes/SceneFPVForestToCity";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="NarratedParallax"
        component={NarratedParallax}
        durationInFrames={1024}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ sceneDurations: Array(8).fill(135) as number[] }}
        calculateMetadata={calculateMetadata}
      />
      <Composition
        id="SceneDebug"
        component={SceneDebug}
        durationInFrames={135}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ sceneIndex: 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }}
      />
      <Composition
        id="SceneFPVForest"
        component={SceneFPVForest}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ durationInFrames: 240 }}
      />
      <Composition
        id="SceneFPVCityNight"
        component={SceneFPVCityNight}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ durationInFrames: 240 }}
      />
      <Composition
        id="SceneFPVForestToCity"
        component={SceneFPVForestToCity}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ durationInFrames: 360 }}
      />
    </>
  );
};
