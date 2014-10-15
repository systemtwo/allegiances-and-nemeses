class Unit:
    def __init__(self, unitType, country, territory):
        self.type = unitType
        self.territory = territory
        self.country = country


class UnitInfo:
    def __init__(self, dictionary):
        self.cost = dictionary["cost"]
        self.movement = dictionary["move"]
        self.attack = dictionary["attack"]
        self.defense = dictionary["defence"]

        if "description" in dictionary:
            self.description = dictionary["description"]