"""Upgrades bought with seeds. Each appears in the shop once its requirements are met."""
from ..birds import FLOCK
from ..birds.base import Activity, FlockBird
from .base import (
    Currency, Progress, Requirement, Stat, Upgrade, activity_stat, add, bird_stat, multiply, owned,
)

# (birds owned, cost as a multiple of the bird's base cost, name)
FLOCK_TIERS = (
    (1, 10, "Nest Boxes"),
    (5, 25, "Feeders"),
    (15, 200, "Bird Baths"),
    (30, 3_000, "Native Hedgerow"),
    (60, 100_000, "Wildflower Meadow"),
    (100, 10_000_000, "Nature Reserve"),
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


def seeds(id: str, name: str, icon: str, description: str, cost: float, effects, requires) -> Upgrade:
    return Upgrade(
        id=id, name=name, icon=icon, description=description, currency=Currency.SEEDS,
        cost=cost, effects=effects, requires=(requires,),
    )


SEED_UPGRADES = (
    # Shaking the sunflower
    seeds("sturdy-stem", "Sturdy Stem", "sunflower", "Shaking the sunflower drops twice as many seeds.",
          50, (multiply(Stat.CLICK, 2),), Requirement(Progress.CLICKS, 10)),
    seeds("seed-scoop", "Seed Scoop", "spoon", "Catch the seeds that bounce away: shakes drop twice as many.",
          400, (multiply(Stat.CLICK, 2),), Requirement(Progress.SEEDS_EARNED, 500)),
    seeds("sunflower-heart", "Sunflower Heart", "heart", "Each shake also drops 1% of your seeds per second.",
          2_500, (add(Stat.CLICK_FROM_PRODUCTION, 0.01),), Requirement(Progress.SEEDS_EARNED, 5_000)),
    seeds("green-thumb", "Green Thumb", "flower", "Practice pays: shakes drop twice as many seeds.",
          50_000, (multiply(Stat.CLICK, 2),), Requirement(Progress.CLICKS, 500)),
    seeds("harvest-moon", "Harvest Moon", "full-moon", "Each shake drops another 2% of your seeds per second.",
          250_000, (add(Stat.CLICK_FROM_PRODUCTION, 0.02),), Requirement(Progress.SEEDS_EARNED, 1e6)),
    seeds("golden-hour", "Golden Hour", "star", "Each shake drops another 3% of your seeds per second.",
          2.5e8, (add(Stat.CLICK_FROM_PRODUCTION, 0.03),), Requirement(Progress.SEEDS_EARNED, 1e9)),
    # Combos
    seeds("steady-rhythm", "Steady Rhythm", "bolt", "You can pause half a second longer between shakes.",
          800, (add(Stat.COMBO_WINDOW, 0.5),), Requirement(Progress.BEST_COMBO, 15)),
    seeds("drumroll", "Drumroll", "bolt", "A full combo now triples each shake instead of doubling it.",
          40_000, (add(Stat.COMBO_CAP, 1),), Requirement(Progress.BEST_COMBO, 50)),
    seeds("crescendo", "Crescendo", "bolt", "A full combo now quadruples each shake.",
          8e6, (add(Stat.COMBO_CAP, 1),), Requirement(Progress.BEST_COMBO, 100)),
    # Golden seeds
    seeds("shiny-husks", "Shiny Husks", "golden-seed", "Golden seeds stay 50% longer before they fade.",
          1_500, (multiply(Stat.GOLDEN_STAY, 1.5),), Requirement(Progress.GOLDEN_CATCHES, 1)),
    seeds("gold-rush", "Gold Rush", "golden-seed", "Golden seeds turn up 25% more often.",
          75_000, (multiply(Stat.GOLDEN_INTERVAL, 0.75),), Requirement(Progress.GOLDEN_CATCHES, 5)),
    seeds("lucky-charm", "Lucky Charm", "clover", "Golden seed rewards are 50% bigger and boosts last 50% longer.",
          1.5e7, (multiply(Stat.GOLDEN_POWER, 1.5),), Requirement(Progress.GOLDEN_CATCHES, 15)),
    # Petting and tasks
    seeds("gentle-hands", "Gentle Hands", "heart", "Petting a bird gives three times the seeds.",
          1_000, (multiply(Stat.PET_POWER, 3),), Requirement(Progress.PETS, 10)),
    seeds("bird-whisperer", "Bird Whisperer", "heart", "Petting gives three times the seeds again.",
          2e6, (multiply(Stat.PET_POWER, 3),), Requirement(Progress.PETS, 100)),
    seeds("field-notebook", "Field Notebook", "scroll", "Field tasks pay out twice as much.",
          5_000, (multiply(Stat.TASK_REWARD, 2),), Requirement(Progress.TASKS, 3)),
    # Day, night and the whole flock
    seeds("sunlit-clearing", "Sunlit Clearing", "sun", "Day birds forage twice as fast.",
          250_000, (multiply(activity_stat(Activity.DAY), 2),), Requirement(owned(Activity.DAY), 25)),
    seeds("moonlit-glade", "Moonlit Glade", "moon", "Night birds forage twice as fast.",
          250_000, (multiply(activity_stat(Activity.NIGHT), 2),), Requirement(owned(Activity.NIGHT), 25)),
    seeds("sunlit-canopy", "Sunlit Canopy", "sun", "Day birds forage twice as fast again.",
          5e9, (multiply(activity_stat(Activity.DAY), 2),), Requirement(owned(Activity.DAY), 100)),
    seeds("moonlit-marsh", "Moonlit Marsh", "moon", "Night birds forage twice as fast again.",
          5e9, (multiply(activity_stat(Activity.NIGHT), 2),), Requirement(owned(Activity.NIGHT), 100)),
    seeds("mixed-flock", "Mixed Flock", "notes", "Eight species living together: all birds forage 25% faster.",
          5e6, (multiply(Stat.GLOBAL, 1.25),), Requirement(Progress.SPECIES, 8)),
    seeds("biodiversity", "Biodiversity", "star", "Every species in the cove: all birds forage 50% faster.",
          5e13, (multiply(Stat.GLOBAL, 1.5),), Requirement(Progress.SPECIES, 16)),
    *(upgrade for bird in FLOCK for upgrade in flock_upgrades(bird)),
)
