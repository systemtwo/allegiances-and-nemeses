from Board import Board
from Phases import BuyPhase
from Territory import LandTerritory, SeaTerritory
from Country import Country
from Unit import Unit
board = Board("default")
board.units.append(Unit("infantry", board.countries[0], board.territories[0]))

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


print(board.toJSON())
print(board.id)
