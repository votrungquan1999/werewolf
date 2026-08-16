"use client";

import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { createReducerContext } from "src/contexts/createReducerContext";
import {
  addPlayerAction,
  dealRolesAction,
  removePlayerAction,
} from "src/lib/game/game";
import {
  canUndo,
  createHistory,
  HistoryActionType,
  historyReducer,
} from "src/lib/game/history";
import { loadGame, saveGame } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import {
  ActionType,
  type GameState,
  type NightAction,
  type PotionKind,
  type RoleId,
} from "src/lib/game/types";

const [GameProviderBase, useRawGameState, useRawGameDispatch] =
  createReducerContext(historyReducer, createHistory(createInitialState()));

/** Never fires — the store is constant per environment, we only need server vs client. */
function subscribeToNothing(): () => void {
  return () => {};
}

/**
 * Mirrors every state change into localStorage so a lock screen or refresh cannot lose the game.
 */
function GamePersistence(): null {
  const state = useRawGameState();

  // Only the live game is parked; undo history is deliberately not persisted.
  useEffect(() => {
    saveGame(state.present);
  }, [state.present]);

  return null;
}

/**
 * Provides the game to the whole tree, resuming a parked game when one exists.
 * @param props.children - The game screens
 * @returns The provider, or nothing until the client has taken over
 */
export function GameProvider({ children }: { children: ReactNode }) {
  // localStorage is client-only, so the server must render nothing rather than a different tree.
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  const [restored] = useState<GameState | null>(() =>
    typeof window === "undefined" ? null : loadGame(),
  );

  if (!isClient) {
    return null;
  }

  return (
    <GameProviderBase {...(restored === null ? {} : { present: restored })}>
      <GamePersistence />
      {children}
    </GameProviderBase>
  );
}

/**
 * Reads the current game.
 * @returns The whole game state
 */
export function useGame(): GameState {
  return useRawGameState().present;
}

/**
 * Semantic actions for the screens, so no component ever touches raw dispatch.
 * @returns One function per thing a player or host can do
 */
export function useGameActions() {
  const dispatch = useRawGameDispatch();

  return {
    addPlayer: (name: string) => dispatch(addPlayerAction(name)),
    removePlayer: (playerId: string) => dispatch(removePlayerAction(playerId)),
    setRoleCount: (role: RoleId, count: number) =>
      dispatch({ type: ActionType.SetRoleCount, role, count }),
    dealRoles: () => dispatch(dealRolesAction()),
    revealNextPlayer: () => dispatch({ type: ActionType.RevealNextPlayer }),
    startNight: () => dispatch({ type: ActionType.StartNight }),
    startDay: () => dispatch({ type: ActionType.StartDay }),
    submitNightChoice: (
      actorId: string,
      action: NightAction,
      targetId: string | null,
      secondTargetId: string | null = null,
      potionKind: PotionKind | null = null,
    ) =>
      dispatch({
        type: ActionType.SubmitNightChoice,
        actorId,
        action,
        targetId,
        secondTargetId,
        potionKind,
      }),
    advanceNightCursor: () => dispatch({ type: ActionType.AdvanceNightCursor }),
    resolveNight: () => dispatch({ type: ActionType.ResolveNight }),
    castDayVote: (voterId: string, targetId: string) =>
      dispatch({ type: ActionType.CastDayVote, voterId, targetId }),
    resolveDayVote: () => dispatch({ type: ActionType.ResolveDayVote }),
    fireHunterShot: (targetId: string) =>
      dispatch({ type: ActionType.FireHunterShot, targetId }),
    resetGame: () => dispatch({ type: ActionType.ResetGame }),
    undo: () => dispatch({ type: HistoryActionType.Undo }),
  };
}

/**
 * Whether there is a step to take back, so the menu can disable Back when there isn't.
 * @returns True once at least one action has been taken
 */
export function useCanUndo(): boolean {
  return canUndo(useRawGameState());
}
