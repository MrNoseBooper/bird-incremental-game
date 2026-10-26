"""Sanity checks for game content: every reference resolves, and the API serves it."""
import json
import re
import unittest
from pathlib import Path

from backend.birds import FLOCK, KINGFISHER
from backend.birds.base import Activity
from backend.content import build_content
from backend.events import BOONS
from backend.news import NEWS
from backend.server import create_app
from backend.tasks import TASK_KINDS
from backend.upgrades import ALL_UPGRADES
from backend.upgrades.base import Currency, Progress, Stat

HEX_COLOUR = re.compile(r"^#[0-9a-f]{6}$")
PIXEL_JS = Path(__file__).resolve().parent.parent / "public" / "js" / "pixel"
PROGRESS_KEYS = set(Progress) | {f"owned:{b.id}" for b in FLOCK} | {f"owned:{a}" for a in Activity}
STAT_KEYS = set(Stat) | {f"bird:{b.id}" for b in FLOCK} | {f"activity:{a}" for a in Activity}


class ContentTests(unittest.TestCase):
    def test_ids_are_unique(self):
        bird_ids = [bird.id for bird in FLOCK] + [KINGFISHER.id]
        upgrade_ids = [upgrade.id for upgrade in ALL_UPGRADES]
        self.assertEqual(len(bird_ids), len(set(bird_ids)))
        self.assertEqual(len(upgrade_ids), len(set(upgrade_ids)))
        # 'owned:<target>' accepts a bird id or an activity, so the two must never clash.
        self.assertFalse(set(bird_ids) & set(Activity))

    def test_each_bird_costs_and_forages_more_than_the_last(self):
        for cheaper, pricier in zip(FLOCK, FLOCK[1:]):
            self.assertLess(cheaper.base_cost, pricier.base_cost)
            self.assertLess(cheaper.base_production, pricier.base_production)

    def test_upgrades_reference_real_stats(self):
        for upgrade in ALL_UPGRADES:
            with self.subTest(upgrade=upgrade.id):
                self.assertIn(upgrade.currency, set(Currency))
                self.assertGreater(upgrade.cost, 0)
                self.assertTrue(upgrade.effects)
                for effect in upgrade.effects:
                    self.assertIn(effect.stat, STAT_KEYS)
                for requirement in upgrade.requires:
                    self.assertIn(requirement.stat, PROGRESS_KEYS)
                if upgrade.icon.startswith("bird:"):
                    self.assertIn(upgrade.icon.removeprefix("bird:"), {b.id for b in FLOCK})

    def test_upgrade_icons_have_pixel_art(self):
        # Icon keys sit at two spaces of indent in icons.js, e.g. `  seed: {` or `  'full-moon': {`.
        source = (PIXEL_JS / "icons.js").read_text(encoding="utf-8")
        drawn = set(re.findall(r"^  '?([a-z][a-z-]*)'?: \{$", source, re.M))
        for upgrade in ALL_UPGRADES:
            if not upgrade.icon.startswith("bird:"):
                with self.subTest(upgrade=upgrade.id):
                    self.assertIn(upgrade.icon, drawn)

    def test_every_habitat_has_scenery(self):
        # Habitat painters are methods like `  coast(w, h, rnd) {` in scenery.js.
        source = (PIXEL_JS / "scenery.js").read_text(encoding="utf-8")
        painted = set(re.findall(r"^  ([a-z]+)\(w, h, rnd\) \{$", source, re.M))
        for bird in FLOCK:
            with self.subTest(bird=bird.id):
                self.assertIn(bird.habitat, painted)

    def test_boons_and_tasks_are_well_formed(self):
        for boon in BOONS:
            with self.subTest(boon=boon.id):
                self.assertGreater(boon.weight, 0)
                self.assertTrue(boon.seconds_of_seeds or boon.feathers or boon.duration)
                self.assertEqual(bool(boon.duration), bool(boon.effects))
                for effect in boon.effects:
                    self.assertIn(effect.stat, STAT_KEYS)
        self.assertGreaterEqual(len(TASK_KINDS), 4)  # the board holds three tasks of different kinds
        for kind in TASK_KINDS:
            with self.subTest(task=kind.id):
                self.assertIn(kind.counter, set(Progress))
                grows = kind.base > 1 or kind.step or kind.production_seconds
                self.assertEqual("{n}" in kind.text, bool(grows))

    def test_headline_milestones_reference_real_progress(self):
        for headline in NEWS:
            for requirement in headline.requires:
                with self.subTest(headline=headline.text):
                    self.assertIn(requirement.stat, PROGRESS_KEYS)

    def test_plumage_colours_are_hex(self):
        # Colours go straight into SVG markup, so anything else is a bug.
        for species in (*FLOCK, KINGFISHER):
            for field, value in vars(species.plumage).items():
                if isinstance(value, str) and field != "pose":
                    with self.subTest(species=species.id, field=field):
                        self.assertRegex(value, HEX_COLOUR)


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = create_app().test_client()

    def test_content_endpoint_serves_all_content(self):
        response = self.client.get("/api/content")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), json.loads(json.dumps(build_content())))

    def test_frontend_is_served_with_module_friendly_types(self):
        with self.client.get("/") as page:
            self.assertIn(b"Kingfisher Cove", page.data)
        with self.client.get("/js/main.js") as script:
            self.assertEqual(script.status_code, 200)
            self.assertEqual(script.mimetype, "text/javascript")


if __name__ == "__main__":
    unittest.main()
