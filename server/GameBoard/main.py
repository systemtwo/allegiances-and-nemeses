import json
from Board import Board
from Phases import BuyPhase
from Unit import Unit

board = Board("Test Board", "default")
russian_territories = [x for x in board.territories if hasattr(x, "country") and x.country.name == "ussr"]
assert board.countries[0].name == "ussr"
infantry = Unit("infantry", board.countries[0], russian_territories[0])
board.units.append(infantry)
