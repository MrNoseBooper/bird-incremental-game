"""Types for one-time purchases that change the game's stats."""
from dataclasses import dataclass
from enum import StrEnum


class Currency(StrEnum):
    SEEDS = "seeds"
    FEATHERS = "feathers"


class Op(StrEnum):
    MULTIPLY = "mul"
    ADD = "add"


class Stat(StrEnum):
    """Global modifiers. Per-bird and per-activity production use bird_stat() and activity_stat()."""

    CLICK = "click"                                  # seeds per sunflower click
    CLICK_FROM_PRODUCTION = "click_from_production"  # bonus seeds per click, as a fraction of seeds/sec
    GLOBAL = "global"                                # multiplies all bird production
    REST_RATE = "rest_rate"                          # foraging speed of resting birds (1 = full speed)
    BIRD_COST = "bird_cost"                          # multiplies bird prices
    KINGFISHER_INTERVAL = "kingfisher_interval"      # multiplies the wait between visits
    KINGFISHER_STAY = "kingfisher_stay"              # multiplies how long a visit lasts
    KINGFISHER_FEATHERS = "kingfisher_feathers"      # extra feathers per catch
    GOLDEN_INTERVAL = "golden_interval"              # multiplies the wait between golden seeds
    GOLDEN_STAY = "golden_stay"                      # multiplies how long a golden seed stays
    GOLDEN_POWER = "golden_power"                    # multiplies golden seed rewards and boost lengths
    COMBO_CAP = "combo_cap"                          # the click multiplier a full combo reaches
    COMBO_WINDOW = "combo_window"                    # seconds you can pause between shakes
    PET_POWER = "pet_power"                          # multiplies seeds from petting birds
    TASK_REWARD = "task_reward"                      # multiplies field task rewards


class Progress(StrEnum):
    """Counters that upgrades, headlines and tasks can check. Per-species counts use owned()."""

    CLICKS = "clicks"
    SEEDS_EARNED = "seeds_earned"
    BIRDS = "birds"                                  # birds owned, all species together
    SPECIES = "species"                              # species with at least one bird
    UPGRADES = "upgrades"                            # upgrades bought
    KINGFISHER_CATCHES = "kingfisher_catches"
    GOLDEN_CATCHES = "golden_catches"
    PETS = "pets"                                    # birds petted in the aviary
    TASKS = "tasks"                                  # field tasks completed
    COMBO = "combo"                                  # the combo running right now
    BEST_COMBO = "best_combo"


def bird_stat(bird_id: str) -> str:
    return f"bird:{bird_id}"


def activity_stat(activity: str) -> str:
    return f"activity:{activity}"


def owned(bird_id_or_activity: str) -> str:
    return f"owned:{bird_id_or_activity}"


@dataclass(frozen=True)
class Effect:
    stat: str
    op: Op
    value: float


@dataclass(frozen=True)
class Requirement:
    stat: str
    at_least: float


def multiply(stat: str, value: float) -> Effect:
    return Effect(stat, Op.MULTIPLY, value)


def add(stat: str, value: float) -> Effect:
    return Effect(stat, Op.ADD, value)


@dataclass(frozen=True, kw_only=True)
class Upgrade:
    id: str
    name: str
    description: str
    icon: str  # a pixel icon from public/js/pixel/icons.js, or "bird:<id>" to draw that bird
    currency: Currency
    cost: float
    effects: tuple[Effect, ...]
    requires: tuple[Requirement, ...] = ()
