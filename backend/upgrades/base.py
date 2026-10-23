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
    KINGFISHER_INTERVAL = "kingfisher_interval"      # multiplies the wait between visits
    KINGFISHER_STAY = "kingfisher_stay"              # multiplies how long a visit lasts
    KINGFISHER_FEATHERS = "kingfisher_feathers"      # extra feathers per catch


class Progress(StrEnum):
    """Counters an upgrade can require. Bird counts use owned()."""

    CLICKS = "clicks"
    SEEDS_EARNED = "seeds_earned"


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
