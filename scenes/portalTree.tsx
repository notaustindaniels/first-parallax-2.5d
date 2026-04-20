/** portalTree.tsx — Hand-authored "portal tree" silhouette and mask.
 *
 *  The tree is a normal-looking forest foreground tree with a naturally
 *  enclosed region between two main branches that fork and cross.
 *  It's not a "frame" that fills the whole viewport — it's just a tree,
 *  placed as one of the foreground elements in the forest.
 *
 *  The mask path (PORTAL_TREE_HOLE_PATH) traces the inside of that
 *  enclosed region, exactly — same SVG coordinate space as the tree.
 *
 *  Because both the tree and the mask share the same SVG viewBox and
 *  live inside the same CSS 3D translateZ wrapper, they scale in
 *  perspective-lockstep as the camera approaches — exactly like an
 *  After Effects artist keyframing a parent layer with the mask
 *  attached.
 *
 *  VIEWBOX: 1920×1080. The tree is positioned on the right-center of
 *  the frame so the camera (which always stays at viewport center)
 *  naturally aims at the enclosed region as the tree approaches.
 */
import React from "react";

export const PORTAL_TREE_VIEWBOX_W = 1920;
export const PORTAL_TREE_VIEWBOX_H = 1080;

/** SVG path tracing the inside of the enclosed region between the
 *  tree's branches. Hand-traced to sit fully inside the branch
 *  silhouette so the masked city reveal doesn't leak past the tree. */
export const PORTAL_TREE_HOLE_PATH = `
  M 915 475
  C 935 455, 970 445, 1005 448
  C 1040 451, 1065 470, 1075 500
  C 1082 535, 1075 575, 1060 610
  C 1045 645, 1015 670, 985 675
  C 955 678, 925 665, 910 640
  C 895 610, 890 575, 895 540
  C 898 510, 905 490, 915 475
  Z
`.trim();

/** Center of the hole, in SVG coords. */
export const PORTAL_TREE_HOLE_CENTER = { x: 985, y: 560 };

/** Portal tree silhouette. A single tree — trunk + two main branches
 *  that fork, arch, and rejoin at the top to enclose a central region.
 *  Drawn as filled silhouette paths. */
export const PortalTreeSvg: React.FC<{
  color?: string;
  rimColor?: string;
}> = ({ color = "#05100a", rimColor = "#1e3040" }) => {
  return (
    <svg
      viewBox={`0 0 ${PORTAL_TREE_VIEWBOX_W} ${PORTAL_TREE_VIEWBOX_H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      {/* MAIN TRUNK — rises from bottom, splits into the fork at ~y=720.
          Below the fork is one thick trunk; above is the left+right
          arms that will close the loop. */}
      <path
        d="
          M 960 1080
          L 935 1000
          L 920 900
          L 912 800
          L 910 740
          L 920 720
          L 1005 720
          L 1015 740
          L 1025 800
          L 1032 880
          L 1035 960
          L 1028 1020
          L 1020 1080
          Z
        "
        fill={color}
      />

      {/* LEFT BRANCH — reaches up from the fork, curves left then back
          right, arching over the enclosed region to meet the right
          branch at the top */}
      <path
        d="
          M 910 740
          C 880 700, 850 640, 835 580
          C 822 510, 828 450, 855 400
          C 885 350, 935 325, 985 340
          L 985 395
          C 955 385, 925 405, 905 445
          C 885 490, 882 545, 898 590
          C 912 635, 935 670, 965 685
          L 945 720
          Z
        "
        fill={color}
      />

      {/* RIGHT BRANCH — mirrors the left. Reaches up, curves right,
          arches back over the top of the loop to meet the left
          branch */}
      <path
        d="
          M 1005 740
          C 1040 700, 1080 645, 1105 590
          C 1130 530, 1140 470, 1125 415
          C 1108 360, 1060 325, 1000 335
          L 1000 390
          C 1035 380, 1070 400, 1088 440
          C 1108 490, 1108 545, 1090 590
          C 1075 635, 1050 670, 1020 685
          L 1040 720
          Z
        "
        fill={color}
      />

      {/* UPPER CONNECTING SEGMENT — the two branches meet at the top of
          the loop; this little bridge seals it. Forms the top of the
          enclosed region that the mask will trace. */}
      <path
        d="
          M 920 415
          C 945 395, 985 390, 1020 400
          C 1050 415, 1060 440, 1050 460
          C 1030 445, 1000 440, 970 445
          C 940 450, 920 460, 908 470
          C 895 450, 900 425, 920 415
          Z
        "
        fill={color}
      />

      {/* A FEW CHARACTER TWIGS — small side branches projecting outward
          to break up the geometric feel */}
      <path
        d="
          M 840 550
          C 810 555, 780 570, 760 590
          L 770 605
          C 790 590, 815 580, 840 575
          Z
        "
        fill={color}
      />
      <path
        d="
          M 1130 550
          C 1165 555, 1195 570, 1215 595
          L 1205 610
          C 1185 595, 1160 585, 1135 580
          Z
        "
        fill={color}
      />
      <path
        d="
          M 875 790
          C 855 820, 830 855, 810 900
          L 825 910
          C 845 870, 870 840, 890 815
          Z
        "
        fill={color}
      />
      <path
        d="
          M 1070 790
          C 1090 820, 1115 855, 1135 900
          L 1120 910
          C 1100 870, 1075 840, 1055 815
          Z
        "
        fill={color}
      />

      {/* Subtle moonlit rim along the hole edge — thin outline */}
      <path
        d={PORTAL_TREE_HOLE_PATH}
        fill="none"
        stroke={rimColor}
        strokeWidth={2}
        opacity={0.35}
      />
    </svg>
  );
};

/** Hole-only SVG — used as an alpha mask to reveal the city layer
 *  through the tree's enclosed region. White = visible. */
export const PortalTreeHoleMaskSvg: React.FC = () => {
  return (
    <svg
      viewBox={`0 0 ${PORTAL_TREE_VIEWBOX_W} ${PORTAL_TREE_VIEWBOX_H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <path d={PORTAL_TREE_HOLE_PATH} fill="white" />
    </svg>
  );
};

/** CSS-ready mask-image data URL built from PORTAL_TREE_HOLE_PATH.
 *  The SVG document itself is white-on-transparent so it works as a
 *  luminance mask via CSS `mask-image`. */
export const PORTAL_TREE_HOLE_MASK_DATA_URL = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PORTAL_TREE_VIEWBOX_W} ${PORTAL_TREE_VIEWBOX_H}" preserveAspectRatio="xMidYMid slice"><path d="${PORTAL_TREE_HOLE_PATH}" fill="white"/></svg>`;
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `url("data:image/svg+xml;utf8,${encoded}")`;
})();

/** Portal tree component. Previous iterations composed an inner
 *  mask-clipped reveal of the next scene inside the hole — that
 *  approach produced a perspective-scaled reveal that felt wrong
 *  (looked like a "loop in a portal" rather than a true pass-through).
 *
 *  The current architecture puts the reveal content (city scene) at
 *  the COMPOSITION level at natural scale, and masks the forest at
 *  the composition level so the city shows through the tree's hole.
 *  This component now just renders the tree silhouette. */
export const PortalTreeWithReveal: React.FC<{
  color?: string;
  rimColor?: string;
}> = ({ color, rimColor }) => {
  return <PortalTreeSvg color={color} rimColor={rimColor} />;
};
