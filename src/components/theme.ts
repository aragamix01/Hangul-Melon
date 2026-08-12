/** Design tokens lifted from the Claude Design source. */
export const C = {
  bg: "#FBF0F4",
  bgTop: "#FFF6F9",
  surface: "#FFFAFC",
  border: "#F3DDE6",
  borderStrong: "#E9C4D4",
  ink: "#4A3540",
  inkSoft: "#8C7482",
  inkFaint: "#9B8291",
  inkFaintest: "#AE94A3",
  label: "#C2A0B2",

  pink: "#F2A0BE",
  pinkDeep: "#DC85A8",
  pinkHover: "#EE93B4",
  pinkText: "#C97C9E",
  pinkTint: "#FDE8F0",
  pinkTint2: "#FCEAF3",
  pinkTrack: "#F6E2EA",

  blue: "#9CC8DA",
  blueDeep: "#84B4C8",
  blueTint: "#EAF2F6",
  blueBorder: "#D5E7EF",
  blueBorderStrong: "#B3D6E3",
  blueText: "#6E9CAF",
  blueInk: "#4B6673",

  purpleTint: "#F3EDFA",
  purpleBorder: "#E2D6F2",
  purpleText: "#8E7BB5",

  badRed: "#FBE4E4",
  badBorder: "#E9B6B6",
  gold: "#F2C46B",
} as const;

/** Korean glyphs must use the Korean face, not the Latin/Thai stack. */
export const KO = "var(--font-ko), var(--font-ko-sans), serif";
