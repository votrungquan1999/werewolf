"use client";
import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type Reducer,
  useContext,
  useMemo,
  useReducer,
} from "react";

/**
 * Builds a state/dispatch context pair backed by a reducer.
 *
 * Initial state can be seeded per-mount by passing any subset of the state as props
 * to the returned Provider, which is what lets a server component hand data down
 * without an initialiser component or an effect.
 * @param reducer - Pure reducer driving the context
 * @param initialState - Default state before any provider props are merged in
 * @returns Tuple of [Provider, useState, useDispatch]
 */
export function createReducerContext<Action, State>(
  reducer: Reducer<State, Action>,
  initialState: State,
) {
  const stateCtx = createContext<State>(initialState);
  const dispatchCtx = createContext<Dispatch<Action>>(() => {});

  function Provider({
    children,
    middleware,
    ...values
  }: PropsWithChildren<Partial<State>> & {
    middleware?: (
      dispatch: Dispatch<Action>,
      getNextState: (action: Action) => State,
    ) => Dispatch<Action>;
  }) {
    const [state, dispatch] = useReducer(
      reducer,
      initialState,
      (defaultState) => ({
        ...defaultState,
        ...values,
      }),
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: reducer is provided from the outer scope
    const wrapped = useMemo(() => {
      return middleware
        ? middleware(dispatch, (action) => reducer(state, action))
        : dispatch;
    }, [middleware, state]);

    return (
      <stateCtx.Provider value={state}>
        <dispatchCtx.Provider value={wrapped}>{children}</dispatchCtx.Provider>
      </stateCtx.Provider>
    );
  }

  function useDispatch() {
    return useContext(dispatchCtx);
  }

  function useStateContext() {
    return useContext(stateCtx);
  }

  return [Provider, useStateContext, useDispatch] as const;
}
