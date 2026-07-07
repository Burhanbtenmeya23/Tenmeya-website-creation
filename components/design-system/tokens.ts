/**
 * Reference tokens for use in JS/TS contexts (e.g. Framer Motion configs)
 * where a Tailwind class name isn't applicable. The CSS variables in
 * app/globals.css are the source of truth for colors/radius — this file
 * exists for the pieces that have no CSS equivalent.
 */

export const motion = {
  duration: {
    fast: 0.15,
    base: 0.25,
    slow: 0.4,
  },
  easeOut: [0.16, 1, 0.3, 1] as const,
} as const;

export const spacingScale = {
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
} as const;
