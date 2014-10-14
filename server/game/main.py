from Board import Board
from Phases import BuyPhase
from Territory import Territory
from Country import Country
from Unit import Unit

iceland = Country("Iceland")

t1 = Territory("Ontario", 10, iceland)
t2 = Territory("Quebec", 10, iceland)
t3 = Territory("Nova Scotia", 10, iceland)

fighter = Unit("fighter", iceland, t1)

board = Board([fighter], [iceland], "UnitList.json", "TerritoryList.json")

t1.connections.append(t2)
t2.connections.append(t3)
t2.connections.append(t1)
t3.connections.append(t2)

buy = BuyPhase(40)
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
