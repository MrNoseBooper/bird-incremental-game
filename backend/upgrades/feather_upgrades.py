"""Rare upgrades bought with feathers, which only the Kingfisher brings."""
from .base import Currency, Stat, Upgrade, add, multiply

FEATHER_UPGRADES = (
    Upgrade(
        id="golden-petals", name="Golden Petals", icon="flower",
        description="Kingfisher feathers woven into the sunflower: clicks drop three times as many seeds.",
        currency=Currency.FEATHERS, cost=1,
        effects=(multiply(Stat.CLICK, 3),),
    ),
    Upgrade(
        id="riverside-perch", name="Riverside Perch", icon="rod",
        description="A better fishing spot: the Kingfisher waits 30% less between visits.",
        currency=Currency.FEATHERS, cost=2,
        effects=(multiply(Stat.KINGFISHER_INTERVAL, 0.7),),
    ),
    Upgrade(
        id="light-sleepers", name="Light Sleepers", icon="zzz",
        description="Resting birds forage at 50% speed instead of 25%.",
        currency=Currency.FEATHERS, cost=3,
        effects=(add(Stat.REST_RATE, 0.25),),
    ),
    Upgrade(
        id="patient-watcher", name="Patient Watcher", icon="telescope",
        description="The Kingfisher lingers twice as long before flying off.",
        currency=Currency.FEATHERS, cost=4,
        effects=(multiply(Stat.KINGFISHER_STAY, 2),),
    ),
    Upgrade(
        id="iridescent-plumage", name="Iridescent Plumage", icon="sparkle",
        description="Every Kingfisher catch brings one extra feather.",
        currency=Currency.FEATHERS, cost=6,
        effects=(add(Stat.KINGFISHER_FEATHERS, 1),),
    ),
    Upgrade(
        id="dawn-chorus", name="Dawn Chorus", icon="notes",
        description="The whole flock sings together: all birds forage 50% faster.",
        currency=Currency.FEATHERS, cost=10,
        effects=(multiply(Stat.GLOBAL, 1.5),),
    ),
    Upgrade(
        id="halcyon-days", name="Halcyon Days", icon="wave",
        description="In Greek myth the gods calmed the sea so the kingfisher could nest. All birds forage twice as fast.",
        currency=Currency.FEATHERS, cost=25,
        effects=(multiply(Stat.GLOBAL, 2),),
    ),
)
