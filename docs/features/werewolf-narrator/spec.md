# Werewolf (Ma Sói) — one-phone narrator

A mobile-first web app that runs a full in-person Werewolf game from a single phone. No backend, no accounts, no network at runtime. Ships at `werewolf.quanvo.dev`.

## What it does

The host adds players, the app deals roles, the phone circulates so each player privately sees their own card, then the app runs every night and day phase, resolves deaths, and calls the winner.

Roles: Werewolf, Villager, Seer, Doctor, Witch, Hunter, Cupid, Fool. Vietnamese default, English available, switchable mid-game without leaving the screen you are on.

## The interaction model

**The host is a player, so nobody narrates.** That single constraint drives the whole night design:

- **Every living player receives the phone every night**, in one fixed order. Players whose role has nothing to do get a sleep screen ("You get to sleep tonight") with three harmless buttons (Count sheep, Yawn, Roll over) that change nothing; it asks them to keep the phone a few seconds, and "Done · pass to {next} →" unlocks only after a 5-second countdown, which starts again after a refresh or Undo. On the last seat the open letter says "Last turn of the night" with a caption that the rooster crows on Done, and the button reads "Done · wake the village" (same wait); the rooster plays from that tap. Receiving the phone therefore reveals nothing about who holds which role.
- **A turn arrives as the sealed envelope** (the same one as the role reveal, id `night:<n>:<playerId>`): "To An", the header's "Night N" and "Turn {cursor + 1} / {order length}", and "Next: Bob" — or "Last turn of the night" on the last seat. Nothing sensitive is on screen while the phone is physically moving between hands, and the sealed face never shows an avatar or anything role-derived. Swiping it open shows "A letter for An" and the turn; there is no on-screen Undo (the options menu holds it).
- **Every opened turn offers your own role behind a "Your card" chip**: a local, unsaved toggle (`aria-expanded`) that shows "You are the {role}" and the full description as text, never an avatar (a sleep turn shows the same chip, so a picture would leak which role is asleep). It stays shut by default — the phone sits in the open while its holder reads, and an always-visible card was a leak.
- **Nightfall is its own screen.** Everyone sees "Night falls — close your eyes" together and one control opens the night. The last player used to be told privately "you are the last one", which announced nothing to the rest of the table and dropped everyone into the night mid-conversation. It is a real phase, so every night passes through it, not just the first. It names the first living player, lists tonight's living players in pass order (recomputed from the table, not the order saved at the last night's start) and labels the button with the night number; its header holds only the options button.
- **The role reveal is a sealed envelope, opened by swiping a thumb along the seal** ("Swipe to open An's letter"). It shows "Pass the phone to", the address "To An", "Not An? Don't open it — pass the phone to An." and who comes next. The swipe opens at **160 px or more of travel**, decided on the raw pointer delta; a tap or a brushed thumb springs back, so a glance cannot flash the card at the table. Enter/Space (a click with `detail === 0`) opens it at once, since a drag cannot be performed by assistive tech — the WCAG 2.5.7 trade-off is accepted, there is no single-tap alternative. **Once opened, the letter stays open — across a refresh or a language switch too:** which envelope is open is saved with the game (`openSealId`), so the table returns to exactly the view it left, card showing if it was. The letter carries the role, avatar, team line and the only pass-on button ("Done · pass to {next} →", the last player's "Done · on to the night →"); the sealed face has no pass-on and no Undo. The sealed face and the open letter are never both in the DOM, so the card cannot leak. A player who opens someone else's envelope and plays their turn is foul play: the table stops the game, the app does not detect it.
- **Player names are never set in the body colour.** Every name in a sentence is picked out in `--phase-name`, because a name is the one thing on these screens that has to be read at a glance while a phone is changing hands. `NamedLine` splits copy around its `{name}` placeholder to do it, which is why component tests match those lines with the `namedLine` helper rather than a plain string.

## Escape hatches

The options button sits in the **header each screen renders** (`ScreenHeader`: phase label, centre progress, optional leading control, menu), not floating over the screens. It was piled on top at first and covered the phase headings. Each screen takes an optional `menu` prop that `page.tsx` fills; setup and the role reveal do so far. Nothing overlaps anything.

The menu holds everything that must never be one stray tap away from play:

- **Undo lives only in the options menu, on every screen.** It is for the rare "something went wrong" case, so no screen carries its own Undo button; opening the menu in front of the table keeps it visible. It steps the whole game back one action — a mis-tapped vote, the wrong night target, an accidental pass. The menu **closes after each Undo**; reopen it to go further. History lives in `history.ts` as a wrapper reducer over `GameState`, capped at 25 steps, and is deliberately **not** persisted: only the live game is parked, so Undo is unavailable after a refresh.
- **Undo and sealed envelopes.** Undo back to an envelope that was opened shows it **sealed again behind a fresh swipe**, because leaving the card up would show the previous turn to whoever holds the phone now. The sealed face then carries a one-line **neutral "Seal already opened" mark** (broken seal beside the address) whenever its id is in `openedSeals` and it is not the open envelope. The mark never says someone peeked: the owner may have opened it themself before an Undo or a refresh, and an earlier opening can never be erased (Bình's envelope shows it after An's redo even if only the mark remains). A first, never-opened envelope has no mark, and an open letter has none either — a refresh restores only "open", so the mark lives on the sealed face alone. One wording for the reveal and the night. A night's ids carry the night number, so a mark or open id left by night 1 never shows on night 2's envelope.
- **New game** asks first ("Start a new game?", saying what is kept), then returns to the **players step** of setup **keeping the players and the chosen role counts** — re-typing eight names between back-to-back games is the tedious part, and it is the same table playing again. Everything the finished game produced — cards, deaths, votes, the winner — is cleared. The play-again button on the end screen goes through the same action.
- **The language switch** lives here too. It used to float on the screen, where it sat on top of the card.

The menu opens as a **modal bottom sheet**, not an inline panel. Two reasons: a panel rendered in flow pushed the whole screen down every time it opened, and an anchored popover would drop out of the top corner the trigger sits in — the hardest part of a tall phone to reach. A sheet renders in the top layer, so it cannot shift anything, and it lands under the thumb.

## House rules

These vary between tables; these are the ones implemented.

- The **seer** learns only **wolf or not a wolf**, never the exact role. The seer picks a row (never themself), "Check {name}" records the check, and the result (the name, then "is a werewolf" / "is not a werewolf") is read off the saved game's `night.inspectedId`, so a refresh or an Undo from the next player's envelope shows the result again, never a second pick. Check and Done are two undo steps on purpose. **Accepted limit:** menu Undo from the result screen gives the seer the pick list again; Undo needs the options menu opened in front of the table, so there is no per-night lock.
- The **doctor** may protect themselves, but may **not** repeat last night's target. The doctor's list shows everyone alive: their own row is tagged "you", last night's pick is disabled and tagged "saved last night" (that tag wins on their own row), and "Done · pass to …" stays disabled until a row is selected, then saves and passes in one tap. The block is UI-only.
- The **witch** may heal the night's victim **or** poison someone, never both in one night, each potion once per game. She picks the **bottle first and the person second**, so she can poison the very player the wolves went for, and poisoning takes a confirmation — a list of bare names could not say which potion a tap meant, and killing should never be one mis-tap. Both potions are always drawn as tiles with "1 left" / "used" (a spent one is disabled). The heal tile saves and passes in one tap; the poison tile opens a list without her own row (with a local "Back" to the tiles, not an undo step), a pick opens a confirm sheet ("Poison {name}?", "This can't be undone"), "Poison" records and passes in one tap and "Cancel" closes the sheet and keeps the list. "Use neither · pass to {name} →" (last seat: "Use neither · wake the village") sends no choice, so it changes nothing; with both potions spent it is the primary button.
- **Her heal is late-bound and the victim is never named to her.** It always means "save tonight's victim", never a named player, because the phone travels in seat order — whether she acts before or after the pack is luck of the draw, and naming them would hand a strictly better game to whoever happens to sit later. Dawn binds it to the pack's final choice. It is only spent if it actually pulled somebody back — a pack that tied killed nobody, so the bottle stays corked.
- **No role may aim its night action at itself** — not the wolves' kill, the seer's check, the witch's poison, nor the hunter's dying shot — **and a wolf may not bite a packmate** (`canNightTarget(state, action, actorId, targetId)` holds the rule). The lists leave barred players out instead of showing them disabled; the rule is enforced by the UI only, the engine does not re-check it. The two exceptions are deliberate: the **doctor** may shield themselves, and **Cupid** may put themselves in the pair, both of which are real plays rather than mis-taps.
- The **hunter names their quarry on their own night turn**, before knowing whether they die, and may change it any night. If they die — that night, a later night, or lynched by day — the committed shot fires automatically, whatever killed them, the witch's poison included. It is never chosen on the shared day screen: doing so told the whole table who the hunter was and let them pick under pressure with full knowledge. On the night turn the list leaves out the hunter themself and preselects a living earlier mark (tagged "aimed"; a dead mark counts as none). "Aim at {name}" only moves to a local summary ("You are aiming at {name}", "If you die, {name} goes with you.") with a local "Change" back to the list; "Done · pass to …" saves the mark and passes in one undo step. "Skip · pass to {name} →" (last seat: "Skip · wake the village") sends no choice and keeps the earlier mark. A refresh mid-summary shows the list again with the saved mark.
- **Cupid picks exactly two lovers** on night one: a "0 / 2" counter, rows disabled once two are picked (tap a picked row to unpick), and Cupid may pick themself. "Pair them" stays disabled until two are picked, then reads "Pair {first} & {second}" in tap order; that one tap saves the pair and passes the phone on (last seat: it also wakes the village). There is no summary step. Every act turn now opens with the role avatar and a titled heading ("Role: action") with the instruction under it.
- **A lynched lover's partner dies at the next dawn, not on the spot**, and the dawn report never names a cause. Killing them in the open announced both the pairing and the reason; folded into the dawn list they are indistinguishable from a wolf kill or a poisoning.
- **Wolves are informed, not blind** — a wolf's turn lists the other wolves (a lone wolf is told "You are the last wolf.") and tags each target with how many earlier wolves chose it, count only, never who. Picking a row is local; "Done · pass to {next} →" sends the vote and passes the phone as one dispatch (`FinishNightTurn` carries the choice, so one Undo takes both back; a choice that changes nothing does not finish the turn, while declines send no choice). Majority dies; a tie inside the pack kills nobody.
- **A game needs at least three players, and names must differ.** Setup has two steps: the players step, then the roles step. "Next: choose roles" stays disabled below `MIN_PLAYERS`, and the players step says so under the player list. A name already seated (compared trimmed and case-insensitively) is refused with a visible message and the typed text is kept, because two identical names make the envelopes ambiguous. The step is UI state: a refresh or language switch starts again on the players step.
- **Day votes are passed around, but take no identity gate.** The phone goes to each living player in turn — the screen simply names whose vote it is — and anyone may abstain. Night turns confirm who is holding the phone because their content is secret; a day vote's is not, so the confirmation step bought nothing and was removed. The running tally stays hidden until everyone has had the phone — showing it live would tell each voter exactly how everyone before them voted. A tie forces a revote between the tied players; a second tie kills nobody. **The verdict has four wordings**: voted out, nobody voted (no votes means no tied players, so no revote), a first tie (revote), and a tie again (nobody out). It stays on screen after Confirm; the day screen keeps a `closedVote` snapshot because resolving clears both the votes and the revote flag the wording reads.
- **The day opens with a timed argument.** The rooster crows at the moment the night resolves — on the last player's own tap, which is what keeps it a real gesture, since phones refuse audio nobody asked for. The dead are still revealed only on a tap, and then a 2-minute countdown runs before voting, extendable by the minute. It never auto-advances — the table is usually mid-argument, so a human decides when to move on.
- **Lovers are their own third side.** If the last two alive are Cupid's pair they win together, beating both the village and the wolves.
- The **fool** wins alone by being lynched.

## Architecture

**`src/lib/game/` is a pure reducer — no React, no IO.** That is what makes every rule testable as a plain function call with no server and no DOM, and why the test environment defaults to node.

- `types.ts` — the shared contract: every enum, interface, and the `GameAction` union
- `roles.ts` — role registry: team, night action, night order, first-night-only, max per game
- `shuffle.ts` — seeded mulberry32 + Fisher-Yates, so deals are random in play and reproducible in tests
- `setup.ts` — player list, role composition, the deal, the reveal cursor, and `resetGame` (which carries the table and the deck into the next game). **Villagers are derived, never chosen**: every change to the table or another role refills the villager count to `players − everyone else`, so the host picks the specials and never does the arithmetic. A short deck is therefore unreachable; only picking more specialists than seats still warns.
- `history.ts` — undo, as a wrapper reducer holding past states alongside the live one. **One player action must be one dispatch**: `RevealNextPlayer` lays out the night itself and `FinishNightTurn` resolves the night itself, because splitting either into two dispatches left a single undo stranded between them on a phase with nothing to render. **`OpenSeal` is the deliberate exception**: it is a dispatch that is not an undo step (the history layer applies it to `present` and leaves `past` alone), so a peek cannot be undone. Undo keeps the union of the opened-envelope marks (`openedSeals`) of the state it leaves and the one it restores, and a new deal clears them. Seal ids come from `seal.ts` (`reveal:<playerId>`, `night:<n>:<playerId>`). `OpenSeal` sets `openSealId` even when the mark already exists (after Undo the mark is there while the envelope is closed, and a fresh swipe must still open it); a new deal clears both fields.
- `night.ts` — circulation order, per-turn routing, wolf tally, night intents
- `deaths.ts` — `applyDeaths`, shared by night resolution and the day vote; heartbreak cascade (deferred to the next dawn when the death was a daytime lynch); the hunter's pre-committed shot
- `resolve-night.ts` — dawn resolution
- `day.ts` — open vote, tally, revote
- `win.ts` — win conditions
- `game.ts` — action creators and the thin `gameReducer` that delegates to the slices
- `persistence.ts` — localStorage park/resume. **An unusable save is ignored, not trusted**: `loadGame` returns null when the JSON fails to parse, when any field of `createInitialState()` is missing (checked recursively into `night` and `roleCounts`), or when the phase is unknown, or when `openedSeals` is not a list of strings. A saved `openSealId` that no mark backs loads as closed. A bare `JSON.parse … as GameState` used to crash every load, and Reload read the same save again. **Any new `GameState` field therefore discards saves from before it** — that is the intended upgrade path, not a bug.

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

Phase-driven colour comes from `data-phase`, resolving `--color-phase*` tokens: night is deep indigo, setup noir and gold, and **day is a genuinely light palette** — it is played with the lights on, so `[data-phase="day"]` redefines the shared tokens (`--background`, `--card`, `--border`, `--muted-foreground` and the rest) rather than tinting the dark ones. Because custom properties inherit, putting them on the shell flips every descendant with it. `--phase-name` is the colour reserved for player names. The default `:root` block is declared **ahead** of the `[data-phase]` blocks — they match at equal specificity, so source order decides. `text-phase-foreground` is only ever used on a `bg-phase` surface; page text uses `text-foreground`.

**`GameShell` is the only thing in the page tree that sets `data-phase` or paints a background.** Each screen used to set its own, which left the header row outside every one of them and therefore black against an indigo night — it read as a rendering bug on a phone. **The one exception is the options sheet**: it renders in a portal outside the shell, so it inherits nothing and sets `data-phase` itself from the exported `getPhaseAccent`, or it stays dark over the light day. The mapping is not one-to-one with `Phase`: the reveal borrows the setup accent (it is still the deal) and dawn borrows the day's (the village is already awake). A control that needs to sit *above* the page uses `bg-card`, not `bg-phase-muted`, which is now the page itself.

**A stacked control is a plain `<button>`, never a shadcn `Button`.** `pile` is a custom `@utility`, so `tailwind-merge` cannot see it as a display class and leaves `buttonVariants`' `inline-flex` in place: the stack silently becomes a flex row, `place-items-center` goes inert, and a `size-full` child takes the whole row and squeezes its siblings into a column at one edge. That is what pushed the reveal's prompt off-centre. The swipe track and the envelope are plain buttons for this reason.

**Setup's roles step shows each role as a tile**: a drawn avatar (`RoleAvatar`, eight inline SVGs on a 120 viewBox, keyed by `RoleId`), the role's name and a `- count +` stepper. Tapping the **name** opens a `Popover` with the role's rules — never a hover tooltip, because a phone cannot hover. The villager tile has no stepper: its count is derived, "fills the empty seats" is always visible, and a `?` button opens the villager's rules the same way. The step has its own header (Back to the players step, "Step 2 / 2") and a summary line (seats, special roles). "Deal the cards" stays disabled below three players or while the deck overflows; the overflow warning sits just above it. The avatar is decorative unless given a label; it never appears on sealed or shared screens, because a role drawn there would leak it. **Undo of the deal returns to the roles step**, while New game and Play again return to the players step: the setup step is UI state held in `GameProvider`, so it survives the phase change.

**Screens are sized by their content and centred by `GameScreens`, not stretched.** They used to claim the full height, which left a short screen's text stranded in the top third of a tall phone with two-thirds of dead space under it. The content row centres with `content-center-safe` rather than plain centring: on a screen that overflows — a twelve-player vote list — plain centring pushes the top of the content out of the scrollport where it can never be scrolled back to, while safe centring falls back to top-aligned automatically.

**An unbreakable player name must never widen the page.** A name with no spaces (a pasted email or handle) cannot wrap, and a grid sizes an `auto`/`1fr` track to its widest unwrappable content — so one name made every column wider than the phone and pushed buttons, badges and copy off-screen. Two rules keep it contained: page-level grids (body, `GameShell`, `GameScreens`) use `grid-cols-[minmax(0,1fr)]`, and every rendered name carries `wrap-anywhere` (built into `PlayerName`; added by hand where a name is a plain span or a button label, which also needs `whitespace-normal` to undo the Button's `nowrap`). Name-plus-badge rows use `grid-cols-[minmax(0,1fr)_auto]`. `anywhere` rather than `break-word` because only `anywhere` shrinks min-content. **None of this is covered by a test** — jsdom does no layout.

**The server renders the app name, not nothing.** `GameProvider` cannot read `localStorage` on the server, so it renders its `fallback` (`GameLoading`) until the client takes over; a slow phone used to show a black page. The first client render uses the same server snapshot, so hydration matches.

**A crash lands on `src/app/[lang]/error.tsx`**, in the route's language via `useParams`, not Next's English default. Its button clears the save before calling `retry` — retrying on the save that crashed would crash again.

**Fonts are Playfair Display (headings) and Be Vietnam Pro (body)**, loaded through `next/font/google` in `src/app/fonts.ts` and applied as CSS variables on `<html>`. Both carry the Vietnamese subset. The system stacks stay as fallbacks in `globals.css`. A font's own variable must never be named `--font-sans` or `--font-heading`: a variable pointing at itself is invalid, and the app once fell back to Times New Roman. `next build` downloads the fonts, so a build needs network; at runtime the fonts are self-hosted and nothing calls Google. The layout tests mock `src/app/fonts`, because `next/font/google` is empty outside Next.

**Pinch-zoom is not blocked.** `maximumScale: 1` was set early to keep the pass-around steady and has been removed: it fails WCAG 1.4.4, and nothing was zooming by accident. `overscroll-none` on the body is the setting that actually matters here — without it, an Android pull-to-refresh reloads the page and takes a live game with it.

Dark-only (`<html class="dark">`) — it is played in dim rooms. The look is "Black Wax": noir ground `#0C0C0F`, ivory text, gold `#D9B56A` primary. The shadcn tokens live in the `.dark` block (mirrored in `:root`), because the sheets and popovers portal outside `data-phase` and read only those; the day block redefines the whole set in ivory. The setup and night shells paint a starfield (`stars`).

### Copy

**Role descriptions are deliberately funny, and must stay rule-accurate.** They are the only place a player learns what their card does, so each one still states its real constraints — the witch's one-potion-a-night limit, the doctor's no-repeat rule — just in the voice of someone at the table rather than a rulebook. Don't flatten them into dry text.

**Interactive controls carry action labels, never instructions.** The pass-on control originally read "Got it? Let go and pass the phone on" and players didn't recognise it as a button at all; it is now "Done · pass to {name} →", on the opened letter only. Any new control should be named after what it does, with the explanation living outside it.

The Vietnamese is written as a Vietnamese table actually speaks — `soi` for the seer's check, colloquial phrasing on the decoy screen — not as a translation of the English.

## Behaviours

1. Anyone can switch between Vietnamese and English, staying on the same screen
2. A host builds tonight's player list, and cannot start until at least three players are seated
3. The host is told when they have picked more special roles than there are seats (villagers backfill any shortfall, so a deck can only ever be over-full)
4. Each player opens their own sealed envelope with a swipe to see their role, then passes the phone on
5. The phone visits every living player each night, in a fixed order, with decoys
6. The wolves recognise each other, see how many wolves chose each target, and the majority pick dies
7. The seer learns whether a player is a wolf
8. The doctor protects a player and cannot repeat last night's target
9. The village wakes, taps to learn who died — never how — and a doctor-protected player survives
10. The village passes the phone round to vote, anyone may abstain, and a tie forces a revote; the verdict — including "nobody voted" and "tied again" — stays on screen after it is confirmed
11. The witch saves the night's victim or poisons someone
12. The hunter names their quarry in advance, at night, and takes them along whenever they die
13. The game announces the winner the moment one side has won
14. Cupid links two lovers; a lover dying breaks the other's heart at the next dawn; the pair can win alone
15. The fool wins alone if the village votes them out
16. The host resumes an interrupted game after the phone locks or refreshes; a corrupt or outdated save opens a fresh table instead of locking the app
17. Anyone can take back a mis-tap, or start a fresh game after confirming
18. If a screen crashes, players get an error page in their language with a button that starts a new game
19. A long player name wraps instead of pushing controls off a phone screen

## Known gaps

- **No offline support.** There is no service worker and no PWA manifest. The app keeps working if the network drops mid-game, but a cold load needs a connection. Deliberately deferred.
- **Only the app name shows until hydration.** The server renders `GameLoading` instead of a black page, but no game screen appears until the client has read the save.
- **Layout has no automated check.** Wrapping, overflow, fonts and colours were fixed from a visual QA pass (`qa-visual-defects/README.md`) and are unverified by tests, since jsdom does no layout.
- **The error page's recovery is unproven in a real Next runtime.** The test checks that the save is cleared and `retry` is called; that `retry` re-mounts `GameProvider` so it re-reads the now-empty storage is assumed. If it doesn't, switch to `window.location.reload()`.
- **Not a static export.** `next.config.ts` uses `redirects()` for `/` → `/vi`, which `output: "export"` does not support, so this deploys as a Next server app.
- **The engine does not validate actors.** It never checks that a doctor's target passes `canDoctorProtect` or that the actor's role matches the action — gating is the UI's job.
- **Edge cases are untested by design.** The brief was happy-path-only to reach a playable release.

## Testing

`npm test` — 92 tests, node environment by default; component tests opt in per file with `// @vitest-environment jsdom`.

**`vitest.config.mts` passes `--no-experimental-webstorage` to test workers on Node 25+.** Newer Node ships its own global `localStorage`, which hides jsdom's and is undefined without `--localstorage-file`, so without the flag every test that touches storage fails before it asserts anything. It is skipped on older Node, which may not know the flag; the deploy target is Node 24.

**`npm run test:e2e` runs one real-browser swipe test** (`e2e/swipe.spec.ts`, Playwright + Chromium at 390×844). jsdom has neither `touch-action` nor real pointer capture, so the test swipes An's envelope open with the mouse and Bình's with CDP touch events. Playwright's `webServer` starts `next dev` on **port 3107** with `NEXT_DIST_DIR=.next-e2e` (`next.config.ts` reads `distDir` from it), so the run never shares a port or a `.next` directory with a dev server the developer has open; it pipes the server's output and tears it down on every exit. Install the browser once with `npx playwright install chromium`. `vitest.config.mts` excludes `e2e/**` so `npm test` never picks it up.

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
