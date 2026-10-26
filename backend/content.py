"""Everything the frontend needs to run the game, as JSON-ready data."""
from dataclasses import asdict, dataclass

from .birds import FLOCK, KINGFISHER
from .events import BOONS, GOLDEN_SEED
from .news import NEWS
from .tasks import TASK_KINDS
from .upgrades import ALL_UPGRADES


@dataclass(frozen=True, kw_only=True)
class GameRules:
    base_click: float = 1      # seeds per sunflower shake
    cost_growth: float = 1.14  # each bird of a species costs 14% more than the last
    rest_rate: float = 0.25    # resting birds forage at a quarter speed
    day_seconds: int = 45
    night_seconds: int = 45
    combo_cap: float = 2       # a full combo doubles every shake
    combo_window: float = 1    # seconds you can pause between shakes before the combo breaks
    combo_full: int = 100      # shakes in a row for the full combo bonus
    pet_seconds: float = 3     # petting a bird gives this many seconds of its foraging, on top of a shake


def build_content() -> dict:
    return {
        "rules": asdict(GameRules()),
        "birds": [asdict(bird) for bird in FLOCK],
        "kingfisher": asdict(KINGFISHER),
        "golden_seed": asdict(GOLDEN_SEED),
        "boons": [asdict(boon) for boon in BOONS],
        "tasks": [asdict(kind) for kind in TASK_KINDS],
        "upgrades": [asdict(upgrade) for upgrade in ALL_UPGRADES],
        "news": [asdict(headline) for headline in NEWS],
    }
