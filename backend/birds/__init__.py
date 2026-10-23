"""Every bird in the cove. Add a species to diurnal.py or nocturnal.py and it shows up in the shop."""
from .diurnal import DIURNAL_BIRDS
from .kingfisher import KINGFISHER
from .nocturnal import NOCTURNAL_BIRDS

# The shop lists birds from cheapest to priciest, mixing day and night birds.
FLOCK = tuple(sorted((*DIURNAL_BIRDS, *NOCTURNAL_BIRDS), key=lambda bird: bird.base_cost))

__all__ = ["FLOCK", "KINGFISHER"]
