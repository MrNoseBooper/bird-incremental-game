"""Upgrades bought with seeds. Each appears in the shop once its requirements are met."""
from ..birds import FLOCK
from ..birds.base import Activity, FlockBird
from .base import (
    Currency, Progress, Requirement, Stat, Upgrade, activity_stat, add, bird_stat, multiply, owned,
)

# (birds owned, cost as a multiple of the bird's base cost, name)
FLOCK_TIERS = (
    (1, 10, "Nest Boxes"),
    (10, 100, "Bird Baths"),
    (25, 2_500, "Native Hedgerow"),
    (50, 75_000, "Wildflower Meadow"),
)


def flock_upgrades(bird: FlockBird) -> list[Upgrade]:
    """Every species gets the same ladder of habitat upgrades, each doubling its foraging."""
    return [
        Upgrade(
            id=f"{bird.id}-{tier}",
            name=f"{bird.name} {name}",
            description=f"Your {bird.name} flock forages twice as fast.",
            icon=f"bird:{bird.id}",
            currency=Currency.SEEDS,
            cost=bird.base_cost * cost_multiple,
            effects=(multiply(bird_stat(bird.id), 2),),
            requires=(Requirement(owned(bird.id), birds_needed),),
        )
        for tier, (birds_needed, cost_multiple, name) in enumerate(FLOCK_TIERS, start=1)
    ]


SEED_UPGRADES = (
    Upgrade(
        id="sturdy-stem", name="Sturdy Stem", icon="sunflower",
        description="Shaking the sunflower drops twice as many seeds.",
        currency=Currency.SEEDS, cost=100,
        effects=(multiply(Stat.CLICK, 2),),
        requires=(Requirement(Progress.CLICKS, 20),),
    ),
    Upgrade(
        id="seed-scoop", name="Seed Scoop", icon="spoon",
        description="Catch the seeds that bounce away: clicks drop twice as many.",
        currency=Currency.SEEDS, cost=2_000,
        effects=(multiply(Stat.CLICK, 2),),
        requires=(Requirement(Progress.SEEDS_EARNED, 1_000),),
    ),
    Upgrade(
        id="sunflower-heart", name="Sunflower Heart", icon="heart",
        description="Each click also drops 1% of your seeds per second.",
        currency=Currency.SEEDS, cost=20_000,
        effects=(add(Stat.CLICK_FROM_PRODUCTION, 0.01),),
        requires=(Requirement(Progress.SEEDS_EARNED, 10_000),),
    ),
    Upgrade(
        id="sunlit-clearing", name="Sunlit Clearing", icon="sun",
        description="Day birds forage twice as fast.",
        currency=Currency.SEEDS, cost=400_000,
        effects=(multiply(activity_stat(Activity.DAY), 2),),
        requires=(Requirement(owned(Activity.DAY), 30),),
    ),
    Upgrade(
        id="moonlit-glade", name="Moonlit Glade", icon="moon",
        description="Night birds forage twice as fast.",
        currency=Currency.SEEDS, cost=400_000,
        effects=(multiply(activity_stat(Activity.NIGHT), 2),),
        requires=(Requirement(owned(Activity.NIGHT), 30),),
    ),
    Upgrade(
        id="harvest-moon", name="Harvest Moon", icon="full-moon",
        description="Each click drops another 2% of your seeds per second.",
        currency=Currency.SEEDS, cost=3_000_000,
        effects=(add(Stat.CLICK_FROM_PRODUCTION, 0.02),),
        requires=(Requirement(Progress.SEEDS_EARNED, 1_000_000),),
    ),
    *(upgrade for bird in FLOCK for upgrade in flock_upgrades(bird)),
)
