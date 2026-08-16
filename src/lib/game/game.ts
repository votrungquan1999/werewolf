import {
  castDayVote,
  getDayVoteOutcome,
  resolveDayVote,
} from "src/lib/game/day";
import { applyDeaths } from "src/lib/game/deaths";
import {
  advanceNightCursor,
  buildNightOrder,
  getCurrentNightTurn,
  submitNightChoice,
} from "src/lib/game/night";
import { resolveNight } from "src/lib/game/resolve-night";
import {
  addPlayer,
  dealRoles,
  removePlayer,
  resetGame,
  revealNextPlayer,
  setRoleCount,
} from "src/lib/game/setup";
import {
  ActionType,
  type AddPlayerAction,
  type DealRolesAction,
  DeathCause,
  type GameAction,
  type GameState,
  Phase,
  type RemovePlayerAction,
  Winner,
} from "src/lib/game/types";
import { getWinner, isFoolWin } from "src/lib/game/win";

/**
 * Builds an add-player action, minting the id here so the reducer stays pure.
 * @param name - The player's display name
 * @returns The action to dispatch
 */
export function addPlayerAction(name: string): AddPlayerAction {
  return { type: ActionType.AddPlayer, id: crypto.randomUUID(), name };
}

/**
 * Builds a remove-player action.
 * @param playerId - The player to drop from tonight's list
 * @returns The action to dispatch
 */
export function removePlayerAction(playerId: string): RemovePlayerAction {
  return { type: ActionType.RemovePlayer, playerId };
}

/**
 * Builds a deal action, minting the shuffle seed here so the reducer stays pure.
 * @returns The action to dispatch
 */
export function dealRolesAction(): DealRolesAction {
  return {
    type: ActionType.DealRoles,
    seed: Math.floor(Math.random() * 2 ** 32),
  };
}

/**
 * Ends the game if the deaths that just landed decided it.
 * @param state - State immediately after deaths were applied
 * @returns The same state, or a finished game naming the winner
 */
function settleAfterDeaths(state: GameState): GameState {
  const winner = getWinner(state);
  if (winner === null) {
    return state;
  }

  return { ...state, winner, phase: Phase.GameOver };
}

/**
 * The single reducer for the whole game, delegating each action to its phase slice.
 * @param state - Current game state
 * @param action - The action to apply
 * @returns The next state
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case ActionType.AddPlayer:
      return addPlayer(state, action.id, action.name);
    case ActionType.RemovePlayer:
      return removePlayer(state, action.playerId);
    case ActionType.SetRoleCount:
      return setRoleCount(state, action.role, action.count);
    case ActionType.DealRoles:
      return dealRoles(state, action.seed);
    case ActionType.RevealNextPlayer:
      return revealNextPlayer(state);
    // The "everyone close your eyes" beat. It owns the night count, so StartNight
    // below never has to guess which phase it was entered from.
    case ActionType.StartNightfall:
      return {
        ...state,
        phase: Phase.Nightfall,
        nightNumber: state.nightNumber + 1,
      };
    // buildNightOrder only computes the order; the reducer owns writing it.
    case ActionType.StartNight:
      return {
        ...state,
        phase: Phase.Night,
        nightOrderIds: buildNightOrder(state),
        nightCursor: 0,
      };
    case ActionType.SubmitNightChoice:
      return submitNightChoice(
        state,
        action.actorId,
        action.action,
        action.targetId,
        action.secondTargetId,
        action.potionKind,
      );
    case ActionType.AdvanceNightCursor:
      return advanceNightCursor(state);
    // Likewise one step: passing the phone on and, at the last seat, resolving
    // the night are a single thing the table did.
    case ActionType.FinishNightTurn: {
      const advanced = advanceNightCursor(state);
      if (getCurrentNightTurn(advanced) !== null) {
        return advanced;
      }

      return settleAfterDeaths(resolveNight(advanced));
    }
    case ActionType.ResolveNight:
      return settleAfterDeaths(resolveNight(state));
    case ActionType.CastDayVote:
      return castDayVote(state, action.voterId, action.targetId);
    case ActionType.ResolveDayVote: {
      // Read the outcome first — resolveDayVote clears the votes it was derived from.
      const outcome = getDayVoteOutcome(state);
      const resolved = resolveDayVote(state);
      if (outcome.eliminatedId === null) {
        return resolved;
      }

      const lynched = applyDeaths(resolved, [
        { playerId: outcome.eliminatedId, cause: DeathCause.Lynch },
      ]);
      // The fool's win is event-driven, so it bypasses the standing win conditions entirely.
      if (isFoolWin(state, outcome.eliminatedId)) {
        return { ...lynched, winner: Winner.Fool, phase: Phase.GameOver };
      }

      return settleAfterDeaths(lynched);
    }
    // The dawn report has been read; the village can start arguing.
    case ActionType.StartDay:
      return {
        ...state,
        phase: Phase.Day,
        dayVotes: {},
        revoteCandidateIds: [],
      };
    case ActionType.ResetGame:
      return resetGame(state);
    default:
      return state;
  }
}
