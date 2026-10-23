"""Night birds: they wake at dusk and forage at full speed until dawn."""
from .base import Activity, FlockBird, Habitat, Plumage, Pose

NOCTURNAL_BIRDS = (
    FlockBird(
        id="nightingale",
        name="Common Nightingale",
        latin="Luscinia megarhynchos",
        fact="Plain brown to look at, but males sing through the night with around 200 different song types.",
        activity=Activity.NIGHT,
        habitat=Habitat.WOODLAND,
        base_cost=110,
        base_production=0.8,
        plumage=Plumage(
            body="#8d6b4f", breast="#d9c7ae", throat="#f3ebdd", belly="#efe5d3", wing="#7b5a3f",
            tail="#a8572c", eye_ring="#efe5d3", beak="#7a6250", legs="#c3a08a", eye_size=3.8,
        ),
    ),
    FlockBird(
        id="tawny-owl",
        name="Tawny Owl",
        latin="Strix aluco",
        fact="The classic 'twit-twoo' is really a duet: the female calls 'ke-wick' and the male answers 'hoo-hoo'.",
        activity=Activity.NIGHT,
        habitat=Habitat.WOODLAND,
        base_cost=11_000,
        base_production=40,
        plumage=Plumage(
            pose=Pose.FRONT, body="#8a5a2e", face="#c58f5a", breast="#a87344", belly="#c49a6c",
            wing="#6f4521", eye_ring="#5a3517", beak="#d9c48e", legs="#d8c3a0",
            eye_size=5.4, beak_length=8,
        ),
    ),
    FlockBird(
        id="nightjar",
        name="European Nightjar",
        latin="Caprimulgus europaeus",
        fact="Sits motionless by day, camouflaged as a piece of bark, then hunts moths at dusk with a huge gape.",
        activity=Activity.NIGHT,
        habitat=Habitat.HEATH,
        base_cost=1_300_000,
        base_production=1_300,
        plumage=Plumage(
            body="#7b6c5b", face="#66594b", throat="#efe7d6", breast="#877664", belly="#9b8a75",
            wing="#665848", wing_bars="#ded0b8", beak="#3a322b", legs="#6e6152",
            beak_length=5, tail_length=18, eye_size=4.2,
        ),
    ),
    FlockBird(
        id="barn-owl",
        name="Barn Owl",
        latin="Tyto alba",
        fact="Can pinpoint prey in complete darkness using its hearing alone.",
        activity=Activity.NIGHT,
        habitat=Habitat.BARN,
        base_cost=180_000_000,
        base_production=38_000,
        plumage=Plumage(
            pose=Pose.FRONT, body="#d2a066", head="#d6a66a", face="#fbf7f0", breast="#f7efe2",
            belly="#fbf6ec", wing="#c08b52", beak="#e8d3c0", legs="#ece2d2",
            eye_size=4.4, beak_length=7,
        ),
    ),
    FlockBird(
        id="kakapo",
        name="Kākāpō",
        latin="Strigops habroptilus",
        fact="A nocturnal, flightless parrot from New Zealand, so rare that every living bird has a name.",
        activity=Activity.NIGHT,
        habitat=Habitat.RAINFOREST,
        base_cost=30_000_000_000,
        base_production=1_200_000,
        plumage=Plumage(
            pose=Pose.FRONT, body="#6f9a3b", head="#86a64a", face="#cdb96e", breast="#a2b452",
            belly="#bdb862", wing="#5b8530", eye_ring="#3d3a2c", beak="#e2dbc9", legs="#8f8b7c",
            eye_size=3.8, beak_length=11,
        ),
    ),
)
