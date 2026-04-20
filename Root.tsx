import React from "react";
import { Composition } from "remotion";
import { SceneFPVForest } from "./scenes/SceneFPVForest";
import { SceneFPVCityNight } from "./scenes/SceneFPVCityNight";
import {
  SceneFPVForestToCity,
  SceneFPVForestToCityPunch,
} from "./scenes/SceneFPVForestToCity";

export const Root: React.FC = () => {
  return (
    <>
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
      <Composition
        id="SceneFPVForestToCityPunch"
        component={SceneFPVForestToCityPunch}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ durationInFrames: 360 }}
      />
    </>
  );
};
