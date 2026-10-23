"""Headlines for the news ticker. Some only start running once you reach a milestone."""
from dataclasses import dataclass

from .upgrades.base import Progress, Requirement, owned


@dataclass(frozen=True)
class Headline:
    text: str
    requires: tuple[Requirement, ...] = ()


def after(stat: str, amount: float) -> tuple[Requirement, ...]:
    return (Requirement(stat, amount),)


NEWS = (
    Headline("Local sunflower stands tall, declines to comment."),
    Headline("Weather service predicts a 100% chance of birds."),
    Headline("Survey: nine out of ten birds prefer sunflower seeds. The tenth was a kingfisher, who prefers fish."),
    Headline("Unusually blue visitor reported by the river. Experts: 'probably a kingfisher, honestly.'"),
    Headline("Sunflower files complaint over 'excessive shaking'.", after(Progress.CLICKS, 100)),
    Headline("Scientists confirm the sunflower is now 40% resilience.", after(Progress.CLICKS, 1_000)),
    Headline("House sparrows move in, immediately start an argument.", after(owned("sparrow"), 1)),
    Headline("Sparrow gang seen loitering by the seed pile. Nobody is surprised.", after(owned("sparrow"), 25)),
    Headline("Neighbours complain of beautiful singing at 3 a.m.", after(owned("nightingale"), 1)),
    Headline("Nightingale choir announces sold-out night-only tour.", after(owned("nightingale"), 25)),
    Headline("Robin follows gardener for six hours, demands worms.", after(owned("robin"), 1)),
    Headline("Mysterious 'twit-twoo' turns out to be two owls having a conversation.", after(owned("tawny-owl"), 1)),
    Headline("Hawk alarm at the feeder was a blue jay doing an impression. Again.", after(owned("blue-jay"), 1)),
    Headline("Search party fails to find nightjar sitting directly in front of them.", after(owned("nightjar"), 1)),
    Headline("Painted bunting accused of showing off. Bunting: 'I just look like this.'", after(owned("painted-bunting"), 1)),
    Headline("Barn owl denies being a ghost despite overwhelming evidence.", after(owned("barn-owl"), 1)),
    Headline("Quetzal's tail streamers declared a tripping hazard by the safety board.", after(owned("quetzal"), 1)),
    Headline("Kākāpō arrives at the cove, introduces itself by name, as all kākāpō do.", after(owned("kakapo"), 1)),
    Headline("Seed economy booms; local squirrels demand a cut.", after(Progress.SEEDS_EARNED, 1e6)),
    Headline("The cove's seed reserves are now visible from space.", after(Progress.SEEDS_EARNED, 1e9)),
    Headline("Economists warn of a seed bubble. Birds are not listening.", after(Progress.SEEDS_EARNED, 1e12)),
)
