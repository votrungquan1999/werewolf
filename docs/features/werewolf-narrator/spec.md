# Werewolf (Ma Sói) — one-phone narrator

A mobile-first web app that runs a full in-person Werewolf game from a single phone. No backend, no accounts, no network at runtime. Ships at `werewolf.quanvo.dev`.

## What it does

The host adds players, the app deals roles, the phone circulates so each player privately sees their own card, then the app runs every night and day phase, resolves deaths, and calls the winner.

Roles: Werewolf, Villager, Seer, Doctor, Witch, Hunter, Cupid, Fool. Vietnamese default, English available, switchable mid-game without leaving the screen you are on.

## The interaction model

**The host is a player, so nobody narrates.** That single constraint drives the whole night design:

- **Every living player receives the phone every night**, in one fixed order. Players whose role has nothing to do get a decoy screen telling them to look busy and pass on. Receiving the phone therefore reveals nothing about who holds which role.
- **A press-and-hold gate sits in front of every turn**, so nothing sensitive is on screen while the phone is physically moving between hands.
- **The role reveal is press-and-hold too** — the card is unmounted from the DOM when not held, so a glance across the table cannot expose it.

## House rules

These vary between tables; these are the ones implemented.

- The **seer** learns only **wolf or not a wolf**, never the exact role.
- The **doctor** may protect themselves, but may **not** repeat last night's target.
- The **witch** may heal the night's victim **or** poison someone, never both in one night, each potion once per game.
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
- `setup.ts` — player list, role composition, the deal, the reveal cursor
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

Phase-driven colour comes from `data-phase` on each screen root, resolving `--color-phase*` tokens: night is deep indigo, day warm amber, setup neutral. The neutral `:root` block is declared **ahead** of the `[data-phase]` blocks — they match at equal specificity, so source order decides. `text-phase-foreground` is only ever used on a `bg-phase` surface; page text uses `text-foreground`.

Dark-only (`<html class="dark">`) — it is played in dim rooms.

## Behaviours

1. Anyone can switch between Vietnamese and English, staying on the same screen
2. A host builds tonight's player list
3. The host is told when the chosen roles don't cover everyone playing
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

## Known gaps

- **No offline support.** There is no service worker and no PWA manifest. The app keeps working if the network drops mid-game, but a cold load needs a connection. Deliberately deferred.
- **The page is blank until hydration.** `GameProvider` cannot read `localStorage` on the server, so it renders nothing until the client takes over — a brief flash on cold load. Fixable by rendering the setup screen server-side and gating only the *resume* on the client.
- **Not a static export.** `next.config.ts` uses `redirects()` for `/` → `/vi`, which `output: "export"` does not support, so this deploys as a Next server app.
- **The witch cannot poison the wolves' own victim.** Heal-vs-poison is inferred by comparing the target to tonight's victim, so pointing at the victim always reads as a heal. Only matters when the doctor already saved them; needs a potion-kind field on the action to fix.
- **The engine does not validate actors.** It never checks that a doctor's target passes `canDoctorProtect` or that the actor's role matches the action — gating is the UI's job.
- **Edge cases are untested by design.** The brief was happy-path-only to reach a playable release.

## Testing

`npm test` — 55 tests, node environment by default; component tests opt in per file with `// @vitest-environment jsdom`.

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
