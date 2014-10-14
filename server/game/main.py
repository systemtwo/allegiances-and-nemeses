from Territory import Territory
from Stages import BuyStage
from Country import Country
from Unit import Unit

iceland = Country("Iceland")

t1 = Territory("Ontario", 10, iceland)
t2 = Territory("Quebec", 10, iceland)
t3 = Territory("Nova Scotia", 10, iceland)

fighter = Unit("fighter", iceland, t1)

t1.connections.append(t2)
t2.connections.append(t3)
t2.connections.append(t1)
t3.connections.append(t2)

buy = BuyStage(40)
buy.buyUnit("asdf")
buy.buyUnit("REAL")
buy.buyUnit("asdf")
print(buy.buyList)
buy.buyUnit("asdf")
buy.buyUnit("asdf")
buy.buyUnit("asdf")
print(buy.buyList)
buy.cancel("REAL")
print(buy.buyList)
buy.cancel("asdf")
print(buy.buyList)
buy.cancel("asd")
print(buy.buyList)

print(t1.distance(t1, fighter))
print(t1.distance(t2, fighter))
print(t1.distance(t3, fighter))
