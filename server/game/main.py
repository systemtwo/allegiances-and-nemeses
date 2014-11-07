import json
from Board import Board
from Phases import BuyPhase
from Territory import LandTerritory, SeaTerritory
from Country import Country
from Unit import Unit

board = Board("default")
russian_territories = [x for x in board.territories if hasattr(x, "country") and x.country.name == "ussr"]
assert board.countries[0].name == "ussr"
infantry = Unit("infantry", board.countries[0], russian_territories[0])
board.units.append(infantry)

buyPhase = BuyPhase(30, board)
buyPhase.buyUnit("infantry")
buyPhase.buyUnit("infantry")
buyPhase.buyUnit("tank")
buyPhase.buyUnit("fighter")
# exceeds price limit
buyPhase.buyUnit("battleship")
buyPhase.buyUnit("factory")
buyPhase.buyUnit("bomber")
# cancel
buyPhase.cancel("fighter")
# factory is now affordable
buyPhase.buyUnit("factory")
buyPhase.cancel("infantry")
# should be 1 infantry, 1 tank, 1 factory

attackPhase = buyPhase.nextPhase(board)
assert attackPhase.move(infantry, infantry.territory.connections[0])
assert attackPhase.move(infantry, infantry.territory.connections[1])
assert len(attackPhase.moveList) == 1
assert attackPhase.moveList[infantry][0] == infantry.territory
assert attackPhase.moveList[infantry][1] == infantry.territory.connections[1]