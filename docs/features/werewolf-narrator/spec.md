# Werewolf (Ma Sói) — one-phone narrator

A mobile-first web app that runs a full in-person Werewolf game from a single phone. No backend, no accounts, no network at runtime. Ships at `werewolf.quanvo.dev`.

## What it does

The host adds players, the app deals roles, the phone circulates so each player privately sees their own card, then the app runs every night and day phase, resolves deaths, and calls the winner.

Roles: Werewolf, Villager, Seer, Doctor, Witch, Hunter, Cupid, Fool. Vietnamese default, English available, switchable mid-game without leaving the screen you are on.

## The interaction model

**The host is a player, so nobody narrates.** That single constraint drives the whole night design:

- **Every living player receives the phone every night**, in one fixed order. Players whose role has nothing to do get a decoy screen telling them to look busy and pass on. Receiving the phone therefore reveals nothing about who holds which role.
- **A turn opens only when the player confirms their own name** ("I am An"). Nothing sensitive is on screen while the phone is physically moving between hands. A hold gate was tried here first and replaced — holding is fiddly while a phone is mid-pass.
- **The role reveal is press-and-hold, with a one-second delay** before the card appears. Instant reveal let a brush of the thumb flash the card at the table. The card is unmounted from the DOM when not held, so it cannot leak.

## Escape hatches

An options menu sits in a **header row above the screens**, not floating over them. It was piled on top at first and covered the phase headings, so the page is now `grid-rows-[auto_1fr]` and each screen fills the content row with `min-h-full` rather than claiming `min-h-dvh` for itself. Nothing overlaps anything.

The menu holds everything that must never be one stray tap away from play:

- **Undo** steps the whole game back one action — a mis-tapped vote, the wrong night target, an accidental pass. History lives in `history.ts` as a wrapper reducer over `GameState`, capped at 25 steps, and is deliberately **not** persisted: only the live game is parked. This is the deep recovery route: if the table is already on the day and something went wrong back in the night, tapping it repeatedly walks the whole game back.
- **New game** asks for confirmation first, then returns to setup **keeping the players and the chosen role counts** — re-typing eight names between back-to-back games is the tedious part, and it is the same table playing again. Everything the finished game produced — cards, deaths, votes, the winner — is cleared. The play-again button on the end screen goes through the same action.
- **The language switch** lives here too. It used to float on the screen, where it sat on top of the card.

**Undo is also surfaced inline**, side by side with the primary advance control, so the common case — a phone passed on before its owner looked — is one tap and never needs the menu.

## House rules

These vary between tables; these are the ones implemented.

- The **seer** learns only **wolf or not a wolf**, never the exact role.
- The **doctor** may protect themselves, but may **not** repeat last night's target.
- The **witch** may heal the night's victim **or** poison someone, never both in one night, each potion once per game. She picks the **bottle first and the person second**, so she can poison the very player the wolves went for, and poisoning takes a confirmation — a list of bare names could not say which potion a tap meant, and killing should never be one mis-tap.
- A **wolf may not vote for their own name.** The rest of the pack is still selectable.
- The **hunter** fires even when killed by the witch's poison.
- **Wolves are informed, not blind** — a wolf's turn names the pack and shows the running vote tally from wolves who already voted. Majority dies; a tie inside the pack kills nobody.
- **Day votes are open** — the table argues out loud and the app only counts. A tie forces a revote between the tied players; a second tie kills nobody.
- **Lovers are their own third side.** If the last two alive are Cupid's pair they win together, beating both the village and the wolves.
- The **fool** wins alone by being lynched.

## Architecture

**`src/lib/game/` is a pure reducer — no React, no IO.** That is what makes every rule testable as a plain function call with no server and no DOM, and why the test environment defaults to node.

- `types.ts` — the shared contract: every enum, interface, and the `GameAction` union
- `roles.ts` — role registry: team, night action, night order, first-night-only, max per game
- `shuffle.ts` — seeded mulberry32 + Fisher-Yates, so deals are random in play and reproducible in tests
- `setup.ts` — player list, role composition, the deal, the reveal cursor, and `resetGame` (which carries the table and the deck into the next game). **Villagers are derived, never chosen**: every change to the table or another role refills the villager count to `players − everyone else`, so the host picks the specials and never does the arithmetic. A short deck is therefore unreachable; only picking more specialists than seats still warns.
- `history.ts` — undo, as a wrapper reducer holding past states alongside the live one
- `night.ts` — circulation order, per-turn routing, wolf tally, night intents
- `deaths.ts` — `applyDeaths`, shared by night resolution and the day vote; heartbreak cascade; hunter flag
- `resolve-night.ts` — dawn resolution
- `day.ts` — open vote, tally, revote
- `win.ts` — win conditions
- `game.ts` — action creators and the thin `gameReducer` that delegates to the slices
- `persistence.ts` — localStorage park/resume

**Two invariants that must not be broken:**

1. **Night choices are recorded as intents and resolved together at dawn**, in a fixed order: protect → wolf attack → witch heal → witch poison → hunter. Applying a night action at submit time would make "the doctor saved the wolves' victim" depend on the order the phone happened to be passed.
2. **The lovers win check runs before the wolf and village checks.** A wolf-plus-villager lover pair resolves to the wrong winner otherwise.

**Ids and seeds are minted in action creators, never in the reducer**, so the reducer stays pure.

**A dying hunter holds the game open.** `settleAfterDeaths` refuses to name a winner while `pendingHunterId` is set, because the hunter's shot can still flip the result.

### Phase cycle

`Setup → RoleReveal → Night(1) → Dawn → Day → Night(2) → … → GameOver`

`revealNextPlayer` starts night one; `StartNight` lays out the circulation and advances the night count only when coming from a day; `StartDay` opens the vote; `resolveNight` and `resolveDayVote` apply deaths and may end the game.

### UI

Each screen is a directory under `src/components/` with a server component holding **all** copy and a `"use client"` half holding only interactivity. Every screen is mounted at once on `/[lang]` and gates itself on the phase, so moving between phases is pure state and there is no navigation to lose mid-game.

Phase-driven colour comes from `data-phase`, resolving `--color-phase*` tokens: night is deep indigo, day warm amber, setup neutral. The neutral `:root` block is declared **ahead** of the `[data-phase]` blocks — they match at equal specificity, so source order decides. `text-phase-foreground` is only ever used on a `bg-phase` surface; page text uses `text-foreground`.

**`GameShell` is the only thing that sets `data-phase` or paints a background.** Each screen used to set its own, which left the header row outside every one of them and therefore black against an indigo night — it read as a rendering bug on a phone. The mapping is not one-to-one with `Phase`: the reveal borrows the setup accent (it is still the deal) and dawn borrows the day's (the village is already awake). Screens now size themselves with `min-h-full` and paint nothing. A control that needs to sit *above* the page — the reveal's hold cover — uses `bg-card`, not `bg-phase-muted`, which is now the page itself.

Dark-only (`<html class="dark">`) — it is played in dim rooms.

### Copy

**Role descriptions are deliberately funny, and must stay rule-accurate.** They are the only place a player learns what their card does, so each one still states its real constraints — the witch's one-potion-a-night limit, the doctor's no-repeat rule — just in the voice of someone at the table rather than a rulebook. Don't flatten them into dry text.

**Interactive controls carry action labels, never instructions.** The pass-on control originally read "Got it? Let go and pass the phone on" and players didn't recognise it as a button at all; it is now "Next player →". Any new control should be named after what it does, with the explanation living outside it.

The Vietnamese is written as a Vietnamese table actually speaks — `soi` for the seer's check, colloquial phrasing on the decoy screen — not as a translation of the English.

## Behaviours

1. Anyone can switch between Vietnamese and English, staying on the same screen
2. A host builds tonight's player list
3. The host is told when they have picked more special roles than there are seats (villagers backfill any shortfall, so a deck can only ever be over-full)
4. Each player privately sees their own role, then passes the phone on
5. The phone visits every living player each night, in a fixed order, with decoys
6. The wolves recognise each other, see the running tally, and the majority pick dies
7. The seer learns whether a player is a wolf
8. The doctor protects a player and cannot repeat last night's target
9. The village wakes to learn who died; a doctor-protected player survives
10. The village votes openly; a tie forces a revote
11. The witch saves the night's victim or poisons someone
12. The hunter takes one player with them when they die
13. The game announces the winner the moment one side has won
14. Cupid links two lovers; a lover dying breaks the other's heart; the pair can win alone
15. The fool wins alone if the village votes them out
16. The host resumes an interrupted game after the phone locks or refreshes
17. Anyone can take back a mis-tap, or start a fresh game after confirming

## Known gaps

- **No offline support.** There is no service worker and no PWA manifest. The app keeps working if the network drops mid-game, but a cold load needs a connection. Deliberately deferred.
- **The page is blank until hydration.** `GameProvider` cannot read `localStorage` on the server, so it renders nothing until the client takes over — a brief flash on cold load. Fixable by rendering the setup screen server-side and gating only the *resume* on the client.
- **Not a static export.** `next.config.ts` uses `redirects()` for `/` → `/vi`, which `output: "export"` does not support, so this deploys as a Next server app.
- **The engine does not validate actors.** It never checks that a doctor's target passes `canDoctorProtect` or that the actor's role matches the action — gating is the UI's job.
- **Edge cases are untested by design.** The brief was happy-path-only to reach a playable release.

## Testing

`npm test` — 67 tests, node environment by default; component tests opt in per file with `// @vitest-environment jsdom`.

Test style is `describe("Feature: …") → describe("Scenario: …") → it("should …")` with literal expected values. `game.test.ts` includes a full-game integration test that plays two complete night-day cycles through the reducer to a village win.

## Deployment

Live at **https://werewolf.quanvo.dev**.

App code deploys via **Vercel's native Git integration** — pushing this repo builds and deploys. No Pulumi in this repo.

DNS and the Vercel project live in `github.com/votrungquan1999/personal-infra` (PR #22, merged):

- a `werewolf.quanvo.dev` CNAME subdomain in `config.ts`
- a `werewolf-project` entry in `resources/vercel-projects.ts` (`repo: votrungquan1999/werewolf`, `nodeVersion: 24.x`, framework nextjs)

### Push the repo before Pulumi creates the project

Unlike every other project there, this one is **created** by Pulumi rather than adopted via `pulumi import`. An existing repo is **not** enough — Vercel sets the project's production branch at create time and fails with `git_branch_not_found` if that branch does not exist yet.

The first apply hit exactly this: the repo had been created empty, Vercel created the project and *then* errored on the branch, leaving the project orphaned outside Pulumi state. Recovering meant pushing `main`, then `pulumi import`-ing the orphan before the follow-up apply could add the `ProjectDomain`.

**Order matters: create the repo, push `main`, then let Pulumi run.**
