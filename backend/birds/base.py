"""Types every bird in the cove is built from."""
from dataclasses import dataclass
from enum import StrEnum


class Activity(StrEnum):
    """When a bird is awake and foraging at full speed."""

    DAY = "day"
    NIGHT = "night"


class Pose(StrEnum):
    """How the frontend draws the bird."""

    SIDE = "side"    # songbird in profile
    FRONT = "front"  # owl-style, facing the viewer


class Habitat(StrEnum):
    """The scenery behind a species' row in the aviary."""

    HEDGEROW = "hedgerow"
    WOODLAND = "woodland"
    GARDEN = "garden"
    HEATH = "heath"
    MEADOW = "meadow"
    BARN = "barn"
    RAINFOREST = "rainforest"
    COAST = "coast"
    TUNDRA = "tundra"


@dataclass(frozen=True, kw_only=True)
class Plumage:
    """Hex colours and proportions the frontend uses to draw a bird.

    Optional colours fall back to a neighbouring patch:
    head -> body, face -> head, breast -> belly, throat -> breast, tail -> wing.
    """

    body: str
    belly: str
    wing: str
    beak: str
    legs: str
    head: str | None = None
    face: str | None = None
    breast: str | None = None
    throat: str | None = None
    tail: str | None = None
    crest: str | None = None
    tufts: str | None = None
    wing_bars: str | None = None
    eye_ring: str | None = None
    beak_length: float = 9
    tail_length: float = 14
    eye_size: float = 3.4
    pose: Pose = Pose.SIDE


@dataclass(frozen=True, kw_only=True)
class Species:
    """Anything with feathers that can turn up at the cove."""

    id: str
    name: str
    latin: str
    fact: str
    plumage: Plumage


@dataclass(frozen=True, kw_only=True)
class FlockBird(Species):
    """A bird you attract with seeds; once settled it forages seeds for you."""

    activity: Activity
    habitat: Habitat
    base_cost: float
    base_production: float  # seeds per second while awake


@dataclass(frozen=True, kw_only=True)
class RareVisitor(Species):
    """A bird that can't be bought: it drops by now and then and rewards a quick click."""

    first_visit_seconds: float
    min_interval_seconds: float
    max_interval_seconds: float
    stay_seconds: float
    feathers_per_catch: int
