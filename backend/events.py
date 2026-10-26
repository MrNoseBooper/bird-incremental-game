"""Golden seeds: they glint somewhere in the cove for a few seconds, and catching one grants a random boon."""
from dataclasses import dataclass

from .upgrades.base import Effect, Stat, multiply


@dataclass(frozen=True, kw_only=True)
class GoldenSeed:
    first_visit_seconds: float = 6
    min_interval_seconds: float = 12
    max_interval_seconds: float = 30
    stay_seconds: float = 7


@dataclass(frozen=True, kw_only=True)
class Boon:
    id: str
    name: str
    description: str
    weight: float                    # how likely it is, relative to the other boons
    seconds_of_seeds: float = 0      # instant seeds worth this many seconds of foraging
    feathers: int = 0
    duration: float = 0              # seconds a timed boost lasts
    effects: tuple[Effect, ...] = ()


GOLDEN_SEED = GoldenSeed()

BOONS = (
    Boon(id="seed-shower", name="Seed Shower", weight=50, seconds_of_seeds=60,
         description="A shower of seeds: a whole minute of foraging at once."),
    Boon(id="frenzy", name="Frenzy", weight=30, duration=20,
         effects=(multiply(Stat.GLOBAL, 5),),
         description="Every bird forages five times as fast for 20 seconds."),
    Boon(id="shake-storm", name="Shake Storm", weight=15, duration=12,
         effects=(multiply(Stat.CLICK, 10), multiply(Stat.CLICK_FROM_PRODUCTION, 10)),
         description="Shakes drop ten times the seeds for 12 seconds. Go go go!"),
    Boon(id="feather-drop", name="Feather Drop", weight=5, feathers=1,
         description="A loose kingfisher feather was tucked inside."),
)
