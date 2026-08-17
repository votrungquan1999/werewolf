# Werewolf (Ma Sói) — one-phone narrator

A mobile-first web app that runs a full in-person Werewolf game from a single phone. No backend, no accounts, no network at runtime. Ships at `werewolf.quanvo.dev`.

## What it does

The host adds players, the app deals roles, the phone circulates so each player privately sees their own card, then the app runs every night and day phase, resolves deaths, and calls the winner.

Roles: Werewolf, Villager, Seer, Doctor, Witch, Hunter, Cupid, Fool. Vietnamese default, English available, switchable mid-game without leaving the screen you are on.

## The interaction model

**The host is a player, so nobody narrates.** That single constraint drives the whole night design:

- **Every living player receives the phone every night**, in one fixed order. Players whose role has nothing to do get a decoy screen telling them to look busy and pass on. Receiving the phone therefore reveals nothing about who holds which role.
- **A turn opens by pressing and holding a round button that names the gesture and the player at once** ("Hold to confirm you are An"). The label used to read "I am An", which said who but never how. Nothing sensitive is on screen while the phone is physically moving between hands. This started as a hold on a full-width bar, became a plain tap when the hold proved fiddly mid-pass, and is now a hold again on a **circle** — the shape is the instruction, because a round target that fills as you hold reads as "hold me" where a rectangle reads as "tap me". Releasing early aborts with no effect, and a keyboard press opens the turn outright, since a timed hold cannot be performed by assistive tech.
- **Every turn offers your own role behind a tap**, name and full description, so nobody has to remember eight role rules to read their prompt. It stays shut by default — the phone sits in the open while its holder reads, and an always-visible card was a leak. Formerly this restated your role ("You are the Witch"), decoy turns included. Nobody should have to remember their card across a whole game to understand what the prompt is asking.
- **Nightfall is its own screen.** Everyone sees "Night falls — close your eyes" together and one control opens the night. The last player used to be told privately "you are the last one", which announced nothing to the rest of the table and dropped everyone into the night mid-conversation. It is a real phase, so every night passes through it, not just the first.
- **The role reveal is press-and-hold, with a one-second delay** before the card appears, and **fills as you hold** exactly like the night hand-off — one gesture, taught once, recognised everywhere. Instant reveal let a brush of the thumb flash the card at the table. The card is unmounted from the DOM when not held, so it cannot leak.
- **Player names are never set in the body colour.** Every name in a sentence is picked out in `--phase-name`, because a name is the one thing on these screens that has to be read at a glance while a phone is changing hands. `NamedLine` splits copy around its `{name}` placeholder to do it, which is why component tests match those lines with the `namedLine` helper rather than a plain string.

## Escape hatches

An options menu sits in a **header row above the screens**, not floating over them. It was piled on top at first and covered the phase headings, so the page is now `grid-rows-[auto_1fr]`. Nothing overlaps anything.

The menu holds everything that must never be one stray tap away from play:

- **Undo** steps the whole game back one action — a mis-tapped vote, the wrong night target, an accidental pass. History lives in `history.ts` as a wrapper reducer over `GameState`, capped at 25 steps, and is deliberately **not** persisted: only the live game is parked. This is the deep recovery route: if the table is already on the day and something went wrong back in the night, tapping it repeatedly walks the whole game back.
- **New game** asks for confirmation first, then returns to setup **keeping the players and the chosen role counts** — re-typing eight names between back-to-back games is the tedious part, and it is the same table playing again. Everything the finished game produced — cards, deaths, votes, the winner — is cleared. The play-again button on the end screen goes through the same action.
- **The language switch** lives here too. It used to float on the screen, where it sat on top of the card.

**Undo is also surfaced inline**, side by side with the primary advance control, so the common case — a phone passed on before its owner looked — is one tap and never needs the menu.

The menu opens as a **modal bottom sheet**, not an inline panel. Two reasons: a panel rendered in flow pushed the whole screen down every time it opened, and an anchored popover would drop out of the top corner the trigger sits in — the hardest part of a tall phone to reach. A sheet renders in the top layer, so it cannot shift anything, and it lands under the thumb.

## House rules

These vary between tables; these are the ones implemented.

- The **seer** learns only **wolf or not a wolf**, never the exact role.
- The **doctor** may protect themselves, but may **not** repeat last night's target.
- The **witch** may heal the night's victim **or** poison someone, never both in one night, each potion once per game. She picks the **bottle first and the person second**, so she can poison the very player the wolves went for, and poisoning takes a confirmation — a list of bare names could not say which potion a tap meant, and killing should never be one mis-tap.
- **Her heal is late-bound and the victim is never named to her.** It always means "save tonight's victim", never a named player, because the phone travels in seat order — whether she acts before or after the pack is luck of the draw, and naming them would hand a strictly better game to whoever happens to sit later. Dawn binds it to the pack's final choice. It is only spent if it actually pulled somebody back — a pack that tied killed nobody, so the bottle stays corked.
- **No role may aim its night action at itself** — not the wolves' kill, the seer's check, the witch's poison, nor the hunter's dying shot. The two exceptions are deliberate: the **doctor** may shield themselves, and **Cupid** may put themselves in the pair, both of which are real plays rather than mis-taps.
- The **hunter names their quarry on their own night turn**, before knowing whether they die, and may change it any night. If they die — that night, a later night, or lynched by day — the committed shot fires automatically, whatever killed them, the witch's poison included. It is never chosen on the shared day screen: doing so told the whole table who the hunter was and let them pick under pressure with full knowledge.
- **A lynched lover's partner dies at the next dawn, not on the spot**, and the dawn report never names a cause. Killing them in the open announced both the pairing and the reason; folded into the dawn list they are indistinguishable from a wolf kill or a poisoning.
- **Wolves are informed, not blind** — a wolf's turn names the pack and shows the running vote tally from wolves who already voted. Majority dies; a tie inside the pack kills nobody.
- **Day votes are passed around, but take no identity gate.** The phone goes to each living player in turn — the screen simply names whose vote it is — and anyone may abstain. Night turns confirm who is holding the phone because their content is secret; a day vote's is not, so the confirmation step bought nothing and was removed. The running tally stays hidden until everyone has had the phone — showing it live would tell each voter exactly how everyone before them voted. A tie forces a revote between the tied players; a second tie kills nobody.
- **The day opens with a timed argument.** The rooster crows at the moment the night resolves — on the last player's own tap, which is what keeps it a real gesture, since phones refuse audio nobody asked for. The dead are still revealed only on a tap, and then a 2-minute countdown runs before voting, extendable by the minute. It never auto-advances — the table is usually mid-argument, so a human decides when to move on.
- **Lovers are their own third side.** If the last two alive are Cupid's pair they win together, beating both the village and the wolves.
- The **fool** wins alone by being lynched.

## Architecture

**`src/lib/game/` is a pure reducer — no React, no IO.** That is what makes every rule testable as a plain function call with no server and no DOM, and why the test environment defaults to node.

- `types.ts` — the shared contract: every enum, interface, and the `GameAction` union
- `roles.ts` — role registry: team, night action, night order, first-night-only, max per game
- `shuffle.ts` — seeded mulberry32 + Fisher-Yates, so deals are random in play and reproducible in tests
- `setup.ts` — player list, role composition, the deal, the reveal cursor, and `resetGame` (which carries the table and the deck into the next game). **Villagers are derived, never chosen**: every change to the table or another role refills the villager count to `players − everyone else`, so the host picks the specials and never does the arithmetic. A short deck is therefore unreachable; only picking more specialists than seats still warns.
- `history.ts` — undo, as a wrapper reducer holding past states alongside the live one. **One player action must be one dispatch**: `RevealNextPlayer` lays out the night itself and `FinishNightTurn` resolves the night itself, because splitting either into two dispatches left a single undo stranded between them on a phase with nothing to render.
- `night.ts` — circulation order, per-turn routing, wolf tally, night intents
- `deaths.ts` — `applyDeaths`, shared by night resolution and the day vote; heartbreak cascade (deferred to the next dawn when the death was a daytime lynch); the hunter's pre-committed shot
- `resolve-night.ts` — dawn resolution
- `day.ts` — open vote, tally, revote
- `win.ts` — win conditions
- `game.ts` — action creators and the thin `gameReducer` that delegates to the slices
- `persistence.ts` — localStorage park/resume

**Two invariants that must not be broken:**

1. **Night choices are recorded as intents and resolved together at dawn**, in a fixed order: protect → wolf attack → witch heal → witch poison → hunter. Applying a night action at submit time would make "the doctor saved the wolves' victim" depend on the order the phone happened to be passed.
2. **The lovers win check runs before the wolf and village checks.** A wolf-plus-villager lover pair resolves to the wrong winner otherwise.

**Ids and seeds are minted in action creators, never in the reducer**, so the reducer stays pure.

**The hunter's shot resolves inside `applyDeaths`, never as a prompt.** It was once an interactive panel that held the game open via `pendingHunterId` until the hunter picked; that state, `fireHunterShot` and `canHunterShoot` are all gone. Because the target is committed a night in advance, the shot is just another cascading death — so a win can be declared the moment the dust settles, with nothing left pending.

### Phase cycle

`Setup → RoleReveal → Nightfall → Night(1) → Dawn → Day → Nightfall → Night(2) → … → GameOver`

`revealNextPlayer` starts night one; `StartNight` lays out the circulation and advances the night count only when coming from a day; `StartDay` opens the vote; `resolveNight` and `resolveDayVote` apply deaths and may end the game.

### UI

Each screen is a directory under `src/components/` with a server component holding **all** copy and a `"use client"` half holding only interactivity. Every screen is mounted at once on `/[lang]` and gates itself on the phase, so moving between phases is pure state and there is no navigation to lose mid-game.

Phase-driven colour comes from `data-phase`, resolving `--color-phase*` tokens: night is deep indigo, setup neutral, and **day is a genuinely light palette** — it is played with the lights on, so `[data-phase="day"]` redefines the shared tokens (`--background`, `--card`, `--border`, `--muted-foreground` and the rest) rather than tinting the dark ones. Because custom properties inherit, putting them on the shell flips every descendant with it. `--phase-name` is the colour reserved for player names. The neutral `:root` block is declared **ahead** of the `[data-phase]` blocks — they match at equal specificity, so source order decides. `text-phase-foreground` is only ever used on a `bg-phase` surface; page text uses `text-foreground`.

**`GameShell` is the only thing that sets `data-phase` or paints a background.** Each screen used to set its own, which left the header row outside every one of them and therefore black against an indigo night — it read as a rendering bug on a phone. The mapping is not one-to-one with `Phase`: the reveal borrows the setup accent (it is still the deal) and dawn borrows the day's (the village is already awake). A control that needs to sit *above* the page — the reveal's hold cover — uses `bg-card`, not `bg-phase-muted`, which is now the page itself.

**A stacked control is a plain `<button>`, never a shadcn `Button`.** `pile` is a custom `@utility`, so `tailwind-merge` cannot see it as a display class and leaves `buttonVariants`' `inline-flex` in place: the stack silently becomes a flex row, `place-items-center` goes inert, and a `size-full` child — the hold fill — takes the whole row and squeezes its siblings into a column at one edge. That is what pushed the reveal's prompt off-centre. Both hold controls are plain buttons for this reason.

**The hold fill sits at `-z-10` inside an `isolate`d control.** A transformed element paints as though positioned, so once the two controls genuinely stacked, the growing fill covered the prompt *and* the dealt card — holding produced a blank rectangle and no role. DOM order does not fix it; only the z-index does. `isolate` is what keeps `-z-10` above the button's own background instead of behind it. Both the reveal and the night hold carry this, and the card being opaque is what makes a completed hold read as the card rather than the fill.

**Screens are sized by their content and centred by `GameScreens`, not stretched.** They used to claim the full height, which left a short screen's text stranded in the top third of a tall phone with two-thirds of dead space under it. The content row centres with `content-center-safe` rather than plain centring: on a screen that overflows — a twelve-player vote list — plain centring pushes the top of the content out of the scrollport where it can never be scrolled back to, while safe centring falls back to top-aligned automatically.

**Pinch-zoom is not blocked.** `maximumScale: 1` was set early to keep the pass-around steady and has been removed: it fails WCAG 1.4.4, and nothing was zooming by accident. `overscroll-none` on the body is the setting that actually matters here — without it, an Android pull-to-refresh reloads the page and takes a live game with it.

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
9. The village wakes, taps to learn who died — never how — and a doctor-protected player survives
10. The village passes the phone round to vote, anyone may abstain, and a tie forces a revote
11. The witch saves the night's victim or poisons someone
12. The hunter names their quarry in advance, at night, and takes them along whenever they die
13. The game announces the winner the moment one side has won
14. Cupid links two lovers; a lover dying breaks the other's heart at the next dawn; the pair can win alone
15. The fool wins alone if the village votes them out
16. The host resumes an interrupted game after the phone locks or refreshes
17. Anyone can take back a mis-tap, or start a fresh game after confirming

## Known gaps

- **No offline support.** There is no service worker and no PWA manifest. The app keeps working if the network drops mid-game, but a cold load needs a connection. Deliberately deferred.
- **The page is blank until hydration.** `GameProvider` cannot read `localStorage` on the server, so it renders nothing until the client takes over — a brief flash on cold load. Fixable by rendering the setup screen server-side and gating only the *resume* on the client.
- **Not a static export.** `next.config.ts` uses `redirects()` for `/` → `/vi`, which `output: "export"` does not support, so this deploys as a Next server app.
- **The engine does not validate actors.** It never checks that a doctor's target passes `canDoctorProtect` or that the actor's role matches the action — gating is the UI's job.
- **A day where everybody abstains shows the wrong words.** With no votes recorded, `getDayVoteOutcome` returns no eliminated player and no tied players, so the result screen falls back to the tie copy ("It's a tie — revote between the tied players") before correctly moving on to nightfall. It neither crashes nor loops; the sentence is simply wrong for that case, and fixing it needs its own line of copy.
- **Edge cases are untested by design.** The brief was happy-path-only to reach a playable release.

## Testing

`npm test` — 77 tests, node environment by default; component tests opt in per file with `// @vitest-environment jsdom`.

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
