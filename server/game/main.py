from Board import Board
from Phases import BuyPhase
from Territory import LandTerritory, SeaTerritory
from Country import Country
from Unit import Unit
board = Board("default")

buy = BuyPhase(40, board)
buy.buyUnit("infantry")
buy.buyUnit("tank")
buy.buyUnit("fighter")
print(buy.buyList)
buy.buyUnit("battleship")
buy.buyUnit("factory")
buy.buyUnit("bomber")
print(buy.buyList)
buy.cancel("infantry")
print(buy.buyList)
buy.cancel("fighter")
print(buy.buyList)
buy.cancel("tank")
print(buy.buyList)

print(board.toJSON())
print(board.id)
