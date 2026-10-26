"""The Common Kingfisher: the cove's rare visitor and the only source of feathers."""
from .base import Plumage, RareVisitor

KINGFISHER = RareVisitor(
    id="kingfisher",
    name="Common Kingfisher",
    latin="Alcedo atthis",
    fact="Its beak is so streamlined that it inspired the nose of Japan's 500 Series Shinkansen bullet train.",
    first_visit_seconds=10,
    min_interval_seconds=30,
    max_interval_seconds=60,
    stay_seconds=8,
    feathers_per_catch=1,
    plumage=Plumage(
        body="#0a9bd0", head="#1477b8", face="#f08a2c", throat="#fff6e6", breast="#f08a2c",
        belly="#f39a3c", wing="#0f80b9", wing_bars="#64d6f5", tail="#0b6ea6",
        beak="#1d1d1f", legs="#ea4f2c", beak_length=25, tail_length=9,
    ),
)
