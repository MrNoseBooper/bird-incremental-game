"""Day birds: they forage at full speed from dawn to dusk and rest at night."""
from .base import Activity, FlockBird, Habitat, Plumage

DIURNAL_BIRDS = (
    FlockBird(
        id="sparrow",
        name="House Sparrow",
        latin="Passer domesticus",
        fact="Has lived alongside people for about 10,000 years: wherever we farm, sparrows follow.",
        activity=Activity.DAY,
        habitat=Habitat.HEDGEROW,
        base_cost=15,
        base_production=0.1,
        plumage=Plumage(
            body="#8b5a35", head="#8f8b85", face="#e6dfd2", breast="#b9ae9d", throat="#2f2825",
            belly="#ddd3c2", wing="#6e4528", wing_bars="#f2ead9", tail="#5a3b24",
            beak="#3a3330", legs="#c79e7e",
        ),
    ),
    FlockBird(
        id="robin",
        name="European Robin",
        latin="Erithacus rubecula",
        fact="Bold enough to follow gardeners around, snapping up worms from freshly turned soil.",
        activity=Activity.DAY,
        habitat=Habitat.GARDEN,
        base_cost=1_000,
        base_production=6,
        plumage=Plumage(
            body="#857057", face="#ea6a2c", breast="#ea6a2c", belly="#f3efe6", wing="#776048",
            tail="#6b5541", beak="#2f2925", legs="#7d6553", eye_size=3.7,
        ),
    ),
    FlockBird(
        id="blue-jay",
        name="Blue Jay",
        latin="Cyanocitta cristata",
        fact="A gifted mimic that imitates hawk calls, sometimes to scare other birds off a feeder.",
        activity=Activity.DAY,
        habitat=Habitat.GARDEN,
        base_cost=120_000,
        base_production=230,
        plumage=Plumage(
            body="#3f7fd0", crest="#3f7fd0", face="#eef2f7", throat="#eef2f7", breast="#dde3eb",
            belly="#f2f4f7", wing="#2f66b3", wing_bars="#ffffff", tail="#2f66b3",
            beak="#26292d", legs="#3b3f45",
        ),
    ),
    FlockBird(
        id="painted-bunting",
        name="Painted Bunting",
        latin="Passerina ciris",
        fact="Also called the 'nonpareil', French for 'without equal', thanks to its rainbow plumage.",
        activity=Activity.DAY,
        habitat=Habitat.MEADOW,
        base_cost=15_000_000,
        base_production=7_000,
        plumage=Plumage(
            body="#5fae38", head="#3c5fd8", breast="#e2372f", belly="#e2372f", wing="#3f8f2a",
            tail="#a3423c", eye_ring="#e2372f", beak="#7a7a7a", legs="#8b7b6b",
        ),
    ),
    FlockBird(
        id="quetzal",
        name="Resplendent Quetzal",
        latin="Pharomachrus mocinno",
        fact="Sacred to the Maya and Aztecs; the male's tail streamers can be longer than his body.",
        activity=Activity.DAY,
        habitat=Habitat.RAINFOREST,
        base_cost=2_200_000_000,
        base_production=210_000,
        plumage=Plumage(
            body="#1c9a57", head="#22a861", crest="#22a861", breast="#1c9a57", belly="#d6283f",
            wing="#157a46", tail="#1c9a57", beak="#f0c12f", legs="#6b6b4f",
            tail_length=42, eye_size=3.6,
        ),
    ),
)
