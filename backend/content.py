"""Everything the frontend needs to run the game, as JSON-ready data."""
from dataclasses import asdict, dataclass

from .birds import FLOCK, KINGFISHER
from .news import NEWS
from .upgrades import ALL_UPGRADES


@dataclass(frozen=True, kw_only=True)
class GameRules:
    base_click: float = 1      # seeds per sunflower click
    cost_growth: float = 1.15  # each bird of a species costs 15% more than the last
    rest_rate: float = 0.25    # resting birds forage at a quarter speed
    day_seconds: int = 90
    night_seconds: int = 90


def build_content() -> dict:
    return {
        "rules": asdict(GameRules()),
        "birds": [asdict(bird) for bird in FLOCK],
        "kingfisher": asdict(KINGFISHER),
        "upgrades": [asdict(upgrade) for upgrade in ALL_UPGRADES],
        "news": [asdict(headline) for headline in NEWS],
    }
