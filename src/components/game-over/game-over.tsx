import {
  GameOverPlayAgain,
  GameOverRoster,
  GameOverScreen,
} from "src/components/game-over/game-over.ui";
import { RoleId } from "src/lib/game/types";
import type { Dictionary, RolesDictionary } from "src/lib/i18n/types";

/**
 * Reduces the role copy to the one field the reveal list shows.
 * @param roles - Every role's copy in the table's language
 * @returns Role id to display name, listed explicitly so a new role cannot ship nameless
 */
function toRoleNames(roles: RolesDictionary): Record<RoleId, string> {
  return {
    [RoleId.Werewolf]: roles[RoleId.Werewolf].name,
    [RoleId.Villager]: roles[RoleId.Villager].name,
    [RoleId.Seer]: roles[RoleId.Seer].name,
    [RoleId.Doctor]: roles[RoleId.Doctor].name,
    [RoleId.Witch]: roles[RoleId.Witch].name,
    [RoleId.Hunter]: roles[RoleId.Hunter].name,
    [RoleId.Cupid]: roles[RoleId.Cupid].name,
    [RoleId.Fool]: roles[RoleId.Fool].name,
  };
}

/**
 * The payoff screen: who won, what everyone really was, and a way back to setup.
 * @param props.dict - Every string this screen renders, in the table's language
 * @returns The end screen, gated on the game actually being over
 */
export function GameOver({ dict }: { dict: Dictionary }) {
  return (
    <GameOverScreen headlines={dict.gameOver.headlines}>
      <GameOverRoster
        roleNames={toRoleNames(dict.roles)}
        aliveLabel={dict.common.alive}
        deadLabel={dict.common.dead}
      />
      <GameOverPlayAgain>{dict.gameOver.playAgain}</GameOverPlayAgain>
    </GameOverScreen>
  );
}
