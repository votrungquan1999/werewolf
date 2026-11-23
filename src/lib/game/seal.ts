/**
 * Ids of the sealed envelopes the phone is passed in.
 *
 * Built from the player id, never the name, so two players who share a name keep separate seals.
 */

/**
 * Names a player's envelope in the role reveal.
 * @param playerId - The player the envelope is addressed to.
 * @returns The seal id.
 */
export function getRevealSealId(playerId: string): string {
  return `reveal:${playerId}`;
}

/**
 * Names a player's envelope on one night, so an earlier night's mark never carries over.
 * @param nightNumber - Which night the turn belongs to.
 * @param playerId - The player the envelope is addressed to.
 * @returns The seal id.
 */
export function getNightSealId(nightNumber: number, playerId: string): string {
  return `night:${nightNumber}:${playerId}`;
}
