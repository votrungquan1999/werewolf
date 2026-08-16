/** The daybreak crow, served from `public/`. Public domain — see the LICENSE note beside it. */
const DAYBREAK_SOUND_SRC = "/rooster.m4a";

/**
 * Crows the rooster to announce daybreak.
 *
 * Must be called straight from a tap: phones refuse to play audio that no gesture
 * asked for, and a refusal rejects rather than throwing. Losing the sound is never
 * worth breaking the screen over, so a refusal is swallowed on purpose.
 */
export function playDaybreak(): void {
  if (typeof Audio === "undefined") {
    return;
  }

  // A real error boundary, not defensive noise: play() rejects when a phone refuses
  // autoplay and throws outright where it is unimplemented. Either way the crow is a
  // flourish, and it must never take the dawn report down with it.
  try {
    void new Audio(DAYBREAK_SOUND_SRC).play().catch(() => {});
  } catch {
    return;
  }
}
