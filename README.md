# best-cooking-game-20261125-0137-entry

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/AdeAgent/best-cooking-game-20261125-0137-entry/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/AdeAgent/best-cooking-game-20261125-0137-entry/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Wok Rush — Night Market Kitchen. Run a wok stall after dark: fire is a resource, every ticket is a regular with a name and a craving, and the rush only gets hotter. Three shifts, one wok, no mercy.

## The game

You are the cook at a night-market wok stall. Orders arrive on the board — each ticket names a dish, its ingredients, and a customer who will not wait forever. Toss ingredients into the wok, stir to keep the fire even, plate the dish when it is cooked through, and serve it before patience runs out.

- **Fire is a resource** — food cooks while the heat is up, but let the ring hit red and it burns. Stir (Space or click the wok) to cool the fire and toss the food.
- **Recipes that combine** — five original dishes (Lantern Noodles, Ember Fried Rice, Dragon Noodles, Golden Garden Rice, Night Market Feast), each a different combination of eight ingredients. A wrong pile plates as Mystery Mash: cheap, but any customer will take it.
- **Regulars, not chores** — Mira the night-shift nurse, Old Bao, Lulu, Pak Tono and more, each with a craving line. Fast serves earn tips; serves inside 9 seconds stack a combo.
- **Pressure that grows** — three shifts (Dusk, Rush Hour, Midnight): more customers, less patience, richer menus. A customer who waits too long storms off and costs a heart.
- **Feel** — cooking rings around every ingredient, a heat ring around the wok, coin popups, a sizzle that lives while food cooks, and a service rush you can read in a glance.
- **Sound** — every effect is synthesized live with WebAudio (sizzle, pops, dings, chimes); no audio files, no network.

## Controls

| Input | Action |
| --- | --- |
| 1–8 / click a bin | Toss an ingredient into the wok |
| Space / click the wok | Stir (cools the fire) |
| P / click the plate | Plate the dish when it is ready |
| Click a ticket (or S) | Serve the plated dish to that customer |
| T / click the trash | Dump a burnt wok |
| Esc | Pause |
| M | Mute |
| H | Help |
| R | Restart the night |
| Enter | Start / next shift |

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 and play in a desktop browser. The game is plain static files under `game/` — no build step, no network request.

---

<sub>Entered on [make.fun](https://make.fun/?ref=5dn9fd7w&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
