# Kingfisher Cove

A pixel-art bird-sanctuary incremental game. Shake the sunflower for **seeds**, spend them to attract birds that forage for you, and catch the visiting Kingfisher for rare **feathers**.

## What makes it different

- **Day and night.** The cove runs a 90-second day / 90-second night loop. Day birds rest at night and night birds rest by day, foraging at only 25%. A balanced flock keeps seeds flowing around the clock.
- **The Kingfisher.** Every minute or two a Kingfisher lands on the branch over the river. Click it before it flies off and it dives for a fish, leaving you a feather. Feathers are the rare currency, and the Kingfisher is the only source.
- **Feather upgrades bend the rules.** Wake resting birds, lure the Kingfisher more often, and more.
- **Discovery.** Attracting a species reveals the next one. Every bird is a real species with its scientific name and a fact.

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
  js/systems/               DayNightCycle, KingfisherVisitor
  js/pixel/                 the pixel-art painter: raster (PixelGrid), birds (every species and animation frame),
                            sunflower, scenery (habitats, sky, sun, moon, clouds), icons, colour helpers
  js/ui/                    one class per panel: Scene + Hud (cove), Aviary + NewsTicker + Menu, Shop + Tooltip
                            BirdActor is an aviary bird's behaviour; ParticleField draws seeds, sparkles and fireflies
  js/utils/                 number formatting
tests/                      Python unittest and Node test files
```

## Adding a bird

Add a `FlockBird(...)` to `backend/birds/diurnal.py` or `nocturnal.py`. It appears in the shop sorted by cost, and it gets four habitat upgrades automatically. Its `habitat` picks the scenery behind its aviary strip. Its `Plumage` colours decide how its pixel art is painted: `pose=Pose.FRONT` gives an owl-style bird, and `beak_length`, `tail_length`, `crest`, `wing_bars` and the other fields shape the rest. Run the tests afterwards; they check that ids are unique, costs rise, colours are valid, and every upgrade icon has pixel art.

## Not built yet

Prestige (migration), achievements, cloud saves, sound, and the desktop installer.
