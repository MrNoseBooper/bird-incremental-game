"""Every upgrade in the game: seed upgrades first, then feather upgrades."""
from .feather_upgrades import FEATHER_UPGRADES
from .seed_upgrades import SEED_UPGRADES

ALL_UPGRADES = (*SEED_UPGRADES, *FEATHER_UPGRADES)

__all__ = ["ALL_UPGRADES"]
