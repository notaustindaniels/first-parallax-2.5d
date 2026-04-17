/** SceneFPVCityNight — FPV drone flythrough down a neon-lit city canyon.
 *
 *  Phase 11 upgrades:
 *  - Streetlights: proper silhouette post with multi-layer neon halo
 *    (inner hot core, glow, ambient wash) using CSS drop-shadow for
 *    true radiant light feel.
 *  - Cars: sleek coupe silhouette (not a box), with trailing headlight
 *    and taillight streaks via layered drop-shadow for speed.
 *  - Telephone wires between power poles (new sub-object).
 *  - Neon signs floating mid-canyon.
 */
import React from "react";
import {
  type PlateCutoutProps,
  type SceneKit,
  createFPVScene,
  plateDepth,
  sceneRng,
} from "./fpvRecipe";
import { interpolate } from "remotion";

const palette = {
  backgroundGradient:
    "linear-gradient(180deg, #2a1250 0%, #4a1640 40%, #1a0a28 85%, #05050a 100%)",
  fogColor: "rgba(30,12,48,0.55)",
  showStarfield: false,
};

const buildCityCutout = ({
  plateIndex,
  plateCount,
  seed,
  width,
  height,
}: PlateCutoutProps): React.ReactNode => {
  const depth = plateDepth(plateIndex, plateCount);
  const rand = sceneRng(seed);

  const buildingColor = depth > 0.5 ? "#1a1432" : "#0e0b1a";
  const roofColor = depth > 0.5 ? "#2a1848" : "#180c28";
  const litColor = "#ffd170";
  const offColor = "#0a0816";
  const neon = "#ff4aa0";
  const streetColor = depth > 0.5 ? "#120e22" : "#080618";
  const skyslabColor = depth > 0.5 ? "#180e28" : "#0a061c";

  const leftWallWidth = width * (0.40 - depth * 0.06);
  const leftBuildingCount = 6 + Math.floor((1 - depth) * 4);
  const leftBuildings = Array.from({ length: leftBuildingCount }, () => {
    const w = 80 + rand() * 180;
    const x = rand() * leftWallWidth;
    const h = height * (0.35 + rand() * 0.6 + (1 - depth) * 0.1);
    const windowCols = 2 + Math.floor(rand() * 3);
    const windowRows = Math.max(5, Math.floor(h / 48));
    return {
      x,
      w,
      h,
      windowCols,
      windowRows,
      lit: Array.from({ length: windowCols * windowRows }, () => rand() > 0.5),
    };
  });

  const rightWallWidth = width * (0.40 - depth * 0.06);
  const rightBuildingCount = 6 + Math.floor((1 - depth) * 4);
  const rightBuildings = Array.from({ length: rightBuildingCount }, () => {
    const w = 80 + rand() * 180;
    const x = width - rightWallWidth + rand() * (rightWallWidth - w);
    const h = height * (0.35 + rand() * 0.6 + (1 - depth) * 0.1);
    const windowCols = 2 + Math.floor(rand() * 3);
    const windowRows = Math.max(5, Math.floor(h / 48));
    return {
      x,
      w,
      h,
      windowCols,
      windowRows,
      lit: Array.from({ length: windowCols * windowRows }, () => rand() > 0.5),
    };
  });

  const walkwayTop = height * (0.06 + depth * 0.04);
  const walkwayBottom = walkwayTop + height * (0.12 - depth * 0.03);
  const streetTop = height * (0.84 + depth * 0.04);

  const jutCount = 3 + Math.floor((1 - depth) * 3);
  const juts = Array.from({ length: jutCount }, (_, i) => {
    const fromLeft = i % 2 === 0;
    const baseX = fromLeft
      ? leftWallWidth - 30 + rand() * 60
      : width - rightWallWidth - 30 + rand() * 60;
    const tipX = fromLeft ? baseX + 80 + rand() * 200 : baseX - 80 - rand() * 200;
    const y = walkwayBottom + 30 + rand() * (height * 0.35);
    return { baseX, tipX, y, w: 5 + rand() * 10 };
  });

  const drawBuilding = (
    b: (typeof leftBuildings)[0],
    idx: number,
    prefix: string,
  ) => {
    const colW = (b.w - 16) / b.windowCols;
    const rowH = (b.h - 30) / b.windowRows;
    return (
      <g key={`${prefix}-${idx}`}>
        <rect
          x={b.x}
          y={height - b.h}
          width={b.w}
          height={b.h}
          fill={buildingColor}
        />
        <rect
          x={b.x - 4}
          y={height - b.h}
          width={b.w + 8}
          height={8}
          fill={roofColor}
        />
        {b.lit.map((lit, i) => {
          const col = i % b.windowCols;
          const row = Math.floor(i / b.windowCols);
          return (
            <rect
              key={i}
              x={b.x + 8 + col * colW}
              y={height - b.h + 16 + row * rowH}
              width={Math.max(1, colW - 5)}
              height={Math.max(1, rowH - 5)}
              fill={lit ? litColor : offColor}
              opacity={lit ? 0.92 : 1}
            />
          );
        })}
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <rect x={0} y={0} width={width} height={walkwayTop} fill={skyslabColor} />
      <rect
        x={0}
        y={walkwayTop}
        width={width}
        height={walkwayBottom - walkwayTop}
        fill={roofColor}
        opacity={0.7}
      />
      <rect
        x={100}
        y={walkwayBottom - 5}
        width={width - 200}
        height={4}
        fill={neon}
        opacity={0.95}
      />
      <rect
        x={100}
        y={walkwayBottom - 5}
        width={width - 200}
        height={18}
        fill={neon}
        opacity={0.18}
      />

      <rect
        x={leftWallWidth}
        y={0}
        width={width - leftWallWidth - rightWallWidth}
        height={walkwayBottom}
        fill="transparent"
      />

      <rect
        x={0}
        y={streetTop}
        width={width}
        height={height - streetTop}
        fill={streetColor}
      />
      <rect x={0} y={streetTop - 4} width={width} height={4} fill="#2a1a3a" />

      {leftBuildings.map((b, i) => drawBuilding(b, i, "lb"))}
      {rightBuildings.map((b, i) => drawBuilding(b, i, "rb"))}

      {juts.map((j, i) => (
        <g key={`jut-${i}`}>
          <line
            x1={j.baseX}
            y1={j.y}
            x2={j.tipX}
            y2={j.y - 10 + rand() * 20}
            stroke={roofColor}
            strokeWidth={j.w}
            strokeLinecap="round"
          />
          <rect
            x={j.tipX - 15}
            y={j.y - 18}
            width={30}
            height={12}
            fill={neon}
            opacity={0.6}
          />
        </g>
      ))}
    </svg>
  );
};

// ─── Sub-objects — Phase 11 upgrades ───────────────────────────

/** Streetlamp with multi-layer neon halo. The hot core, the mid glow,
 *  and the ambient wash are separate circles with growing radii and
 *  decreasing opacity — matching the "sodium-vapor bloom" look of
 *  real city-night photography. CSS drop-shadow adds radiant light. */
const Streetlight: React.FC<{ variant: number; seed: number }> = ({
  variant,
}) => {
  // Alternating warm (sodium) and cool (LED) — variant-driven
  const isWarm = variant % 2 === 0;
  const hot = isWarm ? "#fff5c8" : "#c8e8ff";
  const glow = isWarm ? "#ffb84a" : "#4aa0ff";
  const wash = isWarm ? "rgba(255,150,50,0.18)" : "rgba(60,140,255,0.18)";

  const h = 280 + variant * 50;
  const armLen = 30 + variant * 8;

  return (
    <svg
      width={180}
      height={h + 140}
      viewBox={`-90 ${-h - 100} 180 ${h + 140}`}
      style={{
        position: "absolute",
        left: -90,
        top: -h - 100,
        overflow: "visible",
        filter: `drop-shadow(0 0 12px ${glow})`,
      }}
    >
      {/* Base plate / foundation */}
      <ellipse cx={0} cy={-2} rx={16} ry={4} fill="#060410" />

      {/* Post — slightly tapered silhouette */}
      <path
        d={`M ${-4} 0 L ${-3} ${-h + 30} L 3 ${-h + 30} L 4 0 Z`}
        fill="#141020"
      />

      {/* Horizontal arm */}
      <path
        d={`M -1 ${-h + 30} L -1 ${-h + 24} L ${armLen} ${-h + 22} L ${armLen} ${-h + 28} Z`}
        fill="#141020"
      />

      {/* Lamp housing */}
      <rect
        x={armLen - 4}
        y={-h + 28}
        width={12}
        height={6}
        rx={2}
        fill="#1a1428"
      />

      {/* Halo — outermost ambient wash */}
      <circle cx={armLen + 2} cy={-h + 34} r={70} fill={wash} />
      {/* Mid glow ring */}
      <circle cx={armLen + 2} cy={-h + 34} r={36} fill={glow} opacity={0.35} />
      {/* Inner glow */}
      <circle cx={armLen + 2} cy={-h + 34} r={18} fill={glow} opacity={0.7} />
      {/* Hot core */}
      <circle cx={armLen + 2} cy={-h + 34} r={7} fill={hot} opacity={1} />

      {/* Vertical down-cast light cone */}
      <path
        d={`M ${armLen - 10} ${-h + 38} L ${armLen + 14} ${-h + 38} L ${armLen + 55} ${-20} L ${armLen - 55} ${-20} Z`}
        fill={glow}
        opacity={0.08}
      />
    </svg>
  );
};

/** Sleek silhouette coupe. Not a rectangle — a proper low-slung car
 *  profile with windshield rake, wheel wells, and CSS drop-shadow
 *  trails on the headlights and taillights to sell forward speed. */
const Car: React.FC<{ variant: number; seed: number }> = ({ variant, seed }) => {
  const w = 180 + variant * 24;
  const h = 62 + variant * 6;
  const palettes = [
    { body: "#8a1020", accent: "#a42030" }, // red
    { body: "#101a6a", accent: "#2030a0" }, // blue
    { body: "#181818", accent: "#303030" }, // black
    { body: "#b8a020", accent: "#e0c840" }, // yellow
  ];
  const col = palettes[variant % palettes.length];

  // Seeded jitter so every car looks a hair different even at same variant
  const r = sceneRng(seed);
  const tilt = (r() - 0.5) * 1.5;

  return (
    <div
      style={{
        position: "absolute",
        left: -w / 2,
        top: -h - 20,
        width: w,
        height: h + 20,
        transform: `rotate(${tilt}deg)`,
      }}
    >
      {/* Body — car silhouette via SVG path */}
      <svg
        width={w}
        height={h + 20}
        viewBox={`0 0 ${w} ${h + 20}`}
        style={{
          position: "absolute",
          inset: 0,
          // Layered drop-shadows: ground shadow + soft ambient glow under body
          filter:
            "drop-shadow(0 4px 6px rgba(0,0,0,0.7)) drop-shadow(0 0 8px rgba(0,0,0,0.4))",
          overflow: "visible",
        }}
      >
        {/* Ground contact shadow */}
        <ellipse
          cx={w / 2}
          cy={h + 12}
          rx={w * 0.45}
          ry={4}
          fill="#000"
          opacity={0.55}
        />

        {/* Main body — coupe silhouette (rocker → fender → roofline → trunk) */}
        <path
          d={`
            M 8 ${h}
            L 4 ${h * 0.75}
            Q ${w * 0.08} ${h * 0.55}, ${w * 0.18} ${h * 0.5}
            L ${w * 0.28} ${h * 0.45}
            Q ${w * 0.35} ${h * 0.25}, ${w * 0.48} ${h * 0.15}
            L ${w * 0.62} ${h * 0.15}
            Q ${w * 0.72} ${h * 0.28}, ${w * 0.8} ${h * 0.48}
            L ${w * 0.88} ${h * 0.52}
            Q ${w * 0.96} ${h * 0.58}, ${w - 4} ${h * 0.78}
            L ${w - 8} ${h}
            Z
          `}
          fill={col.body}
        />

        {/* Greenhouse / windshield */}
        <path
          d={`
            M ${w * 0.3} ${h * 0.45}
            Q ${w * 0.36} ${h * 0.28}, ${w * 0.48} ${h * 0.2}
            L ${w * 0.62} ${h * 0.2}
            Q ${w * 0.7} ${h * 0.28}, ${w * 0.78} ${h * 0.45}
            Z
          `}
          fill="#050810"
          opacity={0.85}
        />

        {/* Body accent line */}
        <path
          d={`M ${w * 0.08} ${h * 0.65} Q ${w * 0.5} ${h * 0.58}, ${w * 0.92} ${h * 0.65}`}
          stroke={col.accent}
          strokeWidth={1.5}
          fill="none"
          opacity={0.7}
        />

        {/* Wheel wells — dark recesses */}
        <circle cx={w * 0.2} cy={h * 0.85} r={h * 0.32} fill="#040406" />
        <circle cx={w * 0.82} cy={h * 0.85} r={h * 0.32} fill="#040406" />
        {/* Wheels */}
        <circle cx={w * 0.2} cy={h * 0.85} r={h * 0.25} fill="#1a1a1e" />
        <circle cx={w * 0.82} cy={h * 0.85} r={h * 0.25} fill="#1a1a1e" />
        <circle cx={w * 0.2} cy={h * 0.85} r={h * 0.12} fill="#404048" />
        <circle cx={w * 0.82} cy={h * 0.85} r={h * 0.12} fill="#404048" />
      </svg>

      {/* Headlights — right side (assuming car is facing right). Layered
          SVGs with filter drop-shadow so each one emits a glow streak. */}
      <svg
        width={80}
        height={30}
        viewBox="0 0 80 30"
        style={{
          position: "absolute",
          left: w - 24,
          top: h * 0.48,
          overflow: "visible",
          filter:
            "drop-shadow(-10px 0 4px #fff8c0) drop-shadow(-24px 0 12px #ffe870) drop-shadow(-50px 0 20px rgba(255,220,120,0.35))",
        }}
      >
        <ellipse cx={10} cy={15} rx={8} ry={5} fill="#fffde0" />
      </svg>

      {/* Taillights — left side */}
      <svg
        width={80}
        height={30}
        viewBox="0 0 80 30"
        style={{
          position: "absolute",
          left: -20,
          top: h * 0.48,
          overflow: "visible",
          filter:
            "drop-shadow(4px 0 3px #ff4020) drop-shadow(14px 0 8px #ff2010) drop-shadow(30px 0 14px rgba(255,40,20,0.4))",
        }}
      >
        <ellipse cx={20} cy={15} rx={6} ry={4} fill="#ff6040" />
      </svg>
    </div>
  );
};

/** Horizontal telephone wires + pole — spans between streetlight verticals,
 *  sells the feeling of urban infrastructure rushing past the camera. */
const PowerPole: React.FC<{ variant: number; seed: number }> = ({
  variant,
  seed,
}) => {
  const h = 340 + variant * 40;
  const r = sceneRng(seed);
  const sag = 12 + r() * 8;

  return (
    <svg
      width={400}
      height={h + 20}
      viewBox={`-200 ${-h - 10} 400 ${h + 20}`}
      style={{
        position: "absolute",
        left: -200,
        top: -h - 10,
        overflow: "visible",
      }}
    >
      {/* Pole */}
      <rect x={-4} y={-h + 10} width={8} height={h - 10} fill="#0a0614" />
      {/* Crossbar */}
      <rect x={-40} y={-h + 20} width={80} height={5} fill="#0a0614" />
      {/* Insulators */}
      <circle cx={-32} cy={-h + 18} r={3} fill="#2a1a3a" />
      <circle cx={0} cy={-h + 18} r={3} fill="#2a1a3a" />
      <circle cx={32} cy={-h + 18} r={3} fill="#2a1a3a" />
      {/* Wires arcing off into the distance — drawn as catenary curves */}
      <path
        d={`M -32 ${-h + 18} Q -200 ${-h + 18 + sag}, -400 ${-h + 18}`}
        stroke="#150a22"
        strokeWidth={1.5}
        fill="none"
      />
      <path
        d={`M 0 ${-h + 18} Q -200 ${-h + 18 + sag * 1.2}, -400 ${-h + 18}`}
        stroke="#150a22"
        strokeWidth={1.5}
        fill="none"
      />
      <path
        d={`M 32 ${-h + 18} Q -200 ${-h + 18 + sag * 1.4}, -400 ${-h + 18}`}
        stroke="#150a22"
        strokeWidth={1.5}
        fill="none"
      />
      {/* Same on the other side */}
      <path
        d={`M -32 ${-h + 18} Q 200 ${-h + 18 + sag}, 400 ${-h + 18}`}
        stroke="#150a22"
        strokeWidth={1.5}
        fill="none"
      />
      <path
        d={`M 0 ${-h + 18} Q 200 ${-h + 18 + sag * 1.2}, 400 ${-h + 18}`}
        stroke="#150a22"
        strokeWidth={1.5}
        fill="none"
      />
      <path
        d={`M 32 ${-h + 18} Q 200 ${-h + 18 + sag * 1.4}, 400 ${-h + 18}`}
        stroke="#150a22"
        strokeWidth={1.5}
        fill="none"
      />
    </svg>
  );
};

/** Floating neon sign — hanging off a tall wire, drifts past mid-canyon */
const NeonSign: React.FC<{ variant: number; seed: number }> = ({
  variant,
  seed,
}) => {
  const colors = ["#ff4aa0", "#4ae0ff", "#a0ff4a", "#ffaa40"];
  const c = colors[variant % colors.length];
  const r = sceneRng(seed);
  const w = 120 + Math.floor(r() * 60);
  const wireLen = 80 + r() * 120;

  return (
    <svg
      width={w + 40}
      height={60 + wireLen}
      viewBox={`${-w / 2 - 20} ${-wireLen - 30} ${w + 40} ${60 + wireLen}`}
      style={{
        position: "absolute",
        left: -w / 2 - 20,
        top: -wireLen - 30,
        overflow: "visible",
        filter: `drop-shadow(0 0 8px ${c}) drop-shadow(0 0 16px ${c})`,
      }}
    >
      {/* Suspension wire */}
      <line x1={0} y1={-wireLen} x2={0} y2={0} stroke="#0a0614" strokeWidth={1.5} />
      {/* Sign panel */}
      <rect
        x={-w / 2}
        y={0}
        width={w}
        height={30}
        rx={3}
        fill="#050208"
        stroke={c}
        strokeWidth={2}
      />
      {/* Neon tube shapes inside */}
      <path
        d={`M ${-w / 2 + 12} 15 L ${w / 2 - 12} 15`}
        stroke={c}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.95}
      />
      <path
        d={`M ${-w / 2 + 12} 22 L ${-w / 4} 22 M ${w / 6} 22 L ${w / 2 - 12} 22`}
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  );
};

// Camera swoop: start high, dive toward the road
const cityCameraSwoop = (panProgress: number): number => {
  const swoopCurve = panProgress * panProgress;
  return interpolate(swoopCurve, [0, 1], [-300, 200]);
};

const kit: SceneKit = {
  palette,
  buildPlateCutout: buildCityCutout,
  subObjects: [
    {
      Component: Streetlight,
      count: 14,
      xRange: [-650, 650],
      yRange: [-80, 220],
    },
    {
      Component: Car,
      count: 12,
      xRange: [-450, 450],
      yRange: [260, 420],
    },
    {
      Component: PowerPole,
      count: 6,
      xRange: [-550, 550],
      yRange: [-100, 100],
    },
    {
      Component: NeonSign,
      count: 5,
      xRange: [-400, 400],
      yRange: [-200, 0],
    },
  ],
  cameraYOverride: cityCameraSwoop,
};

export const SceneFPVCityNight = createFPVScene(kit);
export const cityKit = kit;
