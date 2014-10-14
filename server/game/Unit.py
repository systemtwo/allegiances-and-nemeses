class Unit:
    def __init__(self, unitType, country, territory):
        self.type = unitType
        self.territory = territory
        self.country = country


def unitInfo(unitType):
    return UnitInfo(10, 3)


class UnitInfo:
    def __init__(self, cost, maxMove):
        self.cost = cost
        self.movement = maxMove