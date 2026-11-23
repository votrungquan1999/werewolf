import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";

// Variable font, so no `weight`; the vietnamese subset covers the app's diacritics.
const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-playfair",
});

const beVietnam = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-be-vietnam",
});

/** Class names that define both font CSS variables; put them on `<html>`. */
export const fontVariables = `${playfair.variable} ${beVietnam.variable}`;
