"""Field tasks: three short goals on the board at a time. Finishing one pays out and deals a new one."""
from dataclasses import dataclass

from .upgrades.base import Progress


@dataclass(frozen=True, kw_only=True)
class TaskKind:
    id: str
    text: str                        # "{n}" becomes the target
    counter: Progress
    base: float                      # target the first time this task is dealt
    step: float = 0                  # added to the target for every task already finished
    peak: bool = False               # counts the highest value reached, not how much it grew
    production_seconds: float = 0    # target is this many seconds of foraging instead (for seed goals)
    reward_seconds: float = 45       # pays this many seconds of foraging
    feather_chance: float = 0


TASK_KINDS = (
    TaskKind(id="shake", text="Shake the sunflower {n} times", counter=Progress.CLICKS, base=30, step=5),
    TaskKind(id="gather", text="Gather {n} seeds", counter=Progress.SEEDS_EARNED, base=100, production_seconds=40),
    TaskKind(id="flock", text="Attract {n} more birds", counter=Progress.BIRDS, base=3, step=0.5),
    TaskKind(id="pet", text="Pet {n} birds in the aviary", counter=Progress.PETS, base=5, step=1),
    TaskKind(id="combo", text="Reach a {n}-shake combo", counter=Progress.COMBO, base=20, step=3, peak=True),
    TaskKind(id="golden", text="Catch a golden seed", counter=Progress.GOLDEN_CATCHES, base=1,
             reward_seconds=60, feather_chance=0.25),
    TaskKind(id="kingfisher", text="Catch the Kingfisher", counter=Progress.KINGFISHER_CATCHES, base=1,
             reward_seconds=90, feather_chance=0.5),
    TaskKind(id="upgrade", text="Buy an upgrade", counter=Progress.UPGRADES, base=1),
)
