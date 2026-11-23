"use client";

import {
  createContext,
  type ReactNode,
  useContext,
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
import { createInitialState, hasEnoughPlayers } from "src/lib/game/setup";
import {
  ActionType,
  type GameState,
  type NightAction,
  type NightChoice,
  type PotionKind,
  type RoleId,
} from "src/lib/game/types";

const [GameProviderBase, useRawGameState, useRawGameDispatch] =
  createReducerContext(historyReducer, createHistory(createInitialState()));

/** Which of the two setup screens the host is on. */
export type SetupStep = 1 | 2;

interface SetupStepContextValue {
  step: SetupStep;
  setStep: (step: SetupStep) => void;
}

const SetupStepContext = createContext<SetupStepContextValue | null>(null);

/**
 * Holds the setup step in UI state: not saved and not an undo step, but it outlives the setup phase.
 * @param props.children - The game screens
 * @returns The provider
 */
function SetupStepProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<SetupStep>(1);
  const state = useGame();

  // Undo can drop the table below the minimum on step 2; store step 1 so a re-seated third player still waits for Next.
  if (step === 2 && !hasEnoughPlayers(state)) {
    setStep(1);
  }

  return (
    <SetupStepContext.Provider value={{ step, setStep }}>
      {children}
    </SetupStepContext.Provider>
  );
}

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
 * @param props.fallback - What the server renders, since only the client can read the saved game
 * @returns The provider, or the fallback until the client has taken over
 */
export function GameProvider({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  // localStorage is client-only, so the server renders the fallback rather than a guessed game.
  const isClient = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  const [restored] = useState<GameState | null>(() =>
    typeof window === "undefined" ? null : loadGame(),
  );

  if (!isClient) {
    return fallback;
  }

  return (
    <GameProviderBase {...(restored === null ? {} : { present: restored })}>
      <GamePersistence />
      <SetupStepProvider>{children}</SetupStepProvider>
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
    finishNightTurn: (choice?: NightChoice) =>
      dispatch({ type: ActionType.FinishNightTurn, choice }),
    resolveNight: () => dispatch({ type: ActionType.ResolveNight }),
    castDayVote: (voterId: string, targetId: string | null) =>
      dispatch({ type: ActionType.CastDayVote, voterId, targetId }),
    startDayVote: () => dispatch({ type: ActionType.StartDayVote }),
    resolveDayVote: () => dispatch({ type: ActionType.ResolveDayVote }),
    resetGame: () => dispatch({ type: ActionType.ResetGame }),
    openSeal: (sealId: string) =>
      dispatch({ type: ActionType.OpenSeal, sealId }),
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

/**
 * Reads and moves the setup step.
 * @returns The step to show, and a setter for the host's navigation
 */
export function useSetupStep(): SetupStepContextValue {
  const context = useContext(SetupStepContext);

  if (context === null) {
    throw new Error("useSetupStep must be used inside GameProvider");
  }

  return context;
}
