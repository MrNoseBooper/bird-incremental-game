# Kingfisher Cove

A pixel-art bird-sanctuary incremental game. Shake the sunflower for **seeds**, spend them to attract birds that forage for you, and catch the visiting Kingfisher for rare **feathers**.

## What makes it different

- **Fast and busy on purpose.** Something worth clicking turns up every few seconds, and rewards land right away, so the game suits players who like quick feedback (it was tuned with ADHD players in mind).
- **Day and night.** The cove runs a 45-second day / 45-second night loop. Day birds rest at night and night birds rest by day, foraging at only 25%. A balanced flock keeps seeds flowing around the clock.
- **Shake combos.** Shake the sunflower quickly to build a combo; every 10 shakes in a row the bonus steps up, to double seeds at 100 (more with upgrades). Pause too long and it breaks.
- **Golden seeds.** Every 12 to 30 seconds one glints somewhere in the cove. Catch it for a Seed Shower, a Frenzy (all birds ×5), a Shake Storm (shakes ×10) or, rarely, a feather.
- **The Kingfisher.** Every 30 to 60 seconds it lands on the branch over the river. Catch it before it flies off and it leaves feathers, the rare currency.
- **Field tasks.** Three short goals at a time ("Pet 8 birds", "Reach a 20-shake combo"…). Each pays out instantly and a new one takes its place; swap any you don't fancy.
- **Pet your birds.** Click birds in the aviary: they hop and drop seeds.
- **Feather upgrades bend the rules.** Wake resting birds, lure golden seeds and the Kingfisher more often, make birds cheaper, and more.
- **Discovery.** 16 real species to attract, each revealing the next, with its scientific name and a fact.

The layout borrows Cookie Clicker's three panels. The cove is on the left: the sunflower with turning sunbeams, sparrows orbiting it, seed rain, and a sun and moon that arc across the sky. The aviary is in the middle, with a news ticker and a habitat strip for every species you own; the birds in it walk, hop, peck, fly between spots and sleep, each move drawn as real animation frames. The store is on the right, with upgrade tiles, tooltips and Buy 1 / 10 / 100.

Everything is drawn as pixel art in code: there are no image files. Each species is painted pixel by pixel from its plumage colours, so a new bird gets its full set of animation frames automatically.

## Run it locally

Use a virtual environment so the game's packages stay out of your system Python.

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
python app.py
```

Then open http://127.0.0.1:8000. Progress saves in the browser (localStorage) every 15 seconds and when you leave the page.

## Tests

```bash
python -m unittest discover tests   # content and API checks (venv active)
node --test                         # game rules, pixel art and bird behaviour (Node 22+)
```

## Deploy to Vercel

Push the project to a GitHub repo and import it in Vercel, or run `vercel deploy`. No config file is needed: Vercel finds the Flask `app` in `app.py` through `requirements.txt` and serves `public/` from its CDN. Vercel runs Python 3.12 by default, which this code supports.

## How it fits together

The **Python backend owns the game content**: every bird, upgrade and rule is a class instance, served as JSON at `/api/content`. The **JavaScript frontend owns the live game**: it fetches that content, runs the loop and draws everything. The game logic has no DOM code, so it runs under Node tests too.

```
app.py                      entry point (Vercel imports `app`; `python app.py` runs it locally)
backend/
  server.py                 Flask app: /api/content, plus the frontend when running locally
  content.py                GameRules and build_content(), the JSON the frontend receives
  news.py                   news ticker headlines, some unlocked by milestones
  events.py                 golden seed timings and the boons they grant
  tasks.py                  the kinds of field task and their targets and rewards
  birds/                    bird types and their stats
    base.py                 Species, FlockBird, RareVisitor, Plumage, Activity, Habitat
    diurnal.py              day birds
    nocturnal.py            night birds
    kingfisher.py           the Kingfisher, the cove's rare visitor
  upgrades/
    base.py                 Upgrade, Effect, Requirement, Stat
    seed_upgrades.py        bought with seeds (includes per-bird habitat upgrades)
    feather_upgrades.py     bought with feathers
public/                     the frontend (HTML, CSS, JS modules, no build step)
  fonts/                    Pixelify Sans, the pixel font (SIL Open Font License, see OFL.txt)
  css/                      main (layout), scene (cove), aviary, shop (store)
  js/core/                  Game (state and rules), SaveManager
  js/models/                Bird, Upgrade
  js/systems/               DayNightCycle, Visitor (Kingfisher and golden seed timing), Buffs, Combo, TaskBoard
  js/pixel/                 the pixel-art painter: raster (PixelGrid), birds (every species and animation frame),
                            sunflower, scenery (habitats, sky, sun, moon, clouds), icons, colour helpers
  js/ui/                    one class per panel: Scene + Hud (cove), Aviary + TaskList + NewsTicker + Menu, Shop + Tooltip
                            BirdActor is an aviary bird's behaviour; ParticleField draws seeds, sparkles and fireflies
  js/utils/                 number formatting
tests/                      Python unittest and Node test files
```

## Adding a bird

Add a `FlockBird(...)` to `backend/birds/diurnal.py` or `nocturnal.py`. It appears in the shop sorted by cost, and it gets four habitat upgrades automatically. Its `habitat` picks the scenery behind its aviary strip. Its `Plumage` colours decide how its pixel art is painted: `pose=Pose.FRONT` gives an owl-style bird, and `beak_length`, `tail_length`, `crest`, `wing_bars` and the other fields shape the rest. Run the tests afterwards; they check that ids are unique, costs rise, colours are valid, and every upgrade icon has pixel art.

## Not built yet

Prestige (migration), achievements, cloud saves, sound, and the desktop installer.
